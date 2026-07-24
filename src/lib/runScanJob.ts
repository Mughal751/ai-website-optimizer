import { connectToDatabase } from './mongodb';
import { Scan } from '@/models/Scan';
import { Job } from '@/models/Job';
import { runScanPipeline } from '@/worker/scanPipeline';

/**
 * Executes one scan end-to-end and writes the result to MongoDB. Invoked
 * from the POST /api/scan route as background work (via Next's `after()`)
 * after the response with the scan id has already been sent — this is
 * what replaces the standalone BullMQ worker process on a Vercel
 * deployment, where there's nowhere to run a persistent job listener.
 *
 * A scan takes roughly 15-60s; Vercel Pro's function duration budget
 * (configurable up to 800s with Fluid Compute) comfortably covers that,
 * since `after()` work still counts against the same invocation's
 * maxDuration.
 */
export async function runScanJob(scanId: string, url: string): Promise<void> {
  await connectToDatabase();

  try {
    await Scan.findByIdAndUpdate(scanId, { status: 'running' });
    await Job.findOneAndUpdate({ scanId }, { status: 'active' });

    const result = await runScanPipeline(url);

    await Scan.findByIdAndUpdate(scanId, {
      status: 'complete',
      overallScore: result.overallScore,
      categoryScores: result.categoryScores,
      rawResults: result.rawResults,
      recommendations: result.recommendations,
      completedAt: new Date()
    });
    await Job.findOneAndUpdate({ scanId }, { status: 'completed' });
  } catch (err) {
    console.error(`[scan ${scanId}] failed:`, err);
    await Scan.findByIdAndUpdate(scanId, { status: 'failed', error: (err as Error).message });
    await Job.findOneAndUpdate(
      { scanId },
      { status: 'failed', lastError: (err as Error).message, $inc: { attempts: 1 } }
    );
  }
}
