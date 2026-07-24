import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { waitUntil } from '@vercel/functions';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Scan } from '@/models/Scan';
import { Job } from '@/models/Job';
import { runScanJob } from '@/lib/runScanJob';
import { normalizeUrl } from '@/lib/url';
import { assertSafeUrl, SsrfValidationError } from '@/lib/ssrf';
import { checkRateLimit } from '@/lib/rateLimit';

// A full six-check scan can take well over the platform's default function
// duration. Bump it explicitly — this requires Vercel Pro (or higher) for
// the full 800s; Hobby is capped at 60s, which may not be enough for a
// slow target site. See README for the Hobby-plan caveat.
export const maxDuration = 300;

const ScanRequestSchema = z.object({ url: z.string().min(1) });

const PER_USER_LIMIT = 10; // scans per hour
const PER_IP_LIMIT = 30; // scans per hour
const WINDOW_SECONDS = 60 * 60;

// This is the single canonical scan submission endpoint. There is
// intentionally no parallel /api/v1/scan — everything goes through here.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ScanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid url is required' }, { status: 400 });
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeUrl(parsed.data.url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // SSRF check up front, before we even enqueue — the worker re-validates
  // again at scan time (DNS can change between now and then), but there's
  // no reason to accept an obviously-unsafe target into the queue at all.
  try {
    await assertSafeUrl(normalizedUrl);
  } catch (err) {
    const message = err instanceof SsrfValidationError ? err.message : 'URL is not allowed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() ?? 'unknown';

  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit(`user:${session.user.id}`, PER_USER_LIMIT, WINDOW_SECONDS),
    checkRateLimit(`ip:${ip}`, PER_IP_LIMIT, WINDOW_SECONDS)
  ]);

  if (!userLimit.allowed || !ipLimit.allowed) {
    const resetSeconds = Math.max(userLimit.resetSeconds, ipLimit.resetSeconds);
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${resetSeconds}s.` },
      { status: 429 }
    );
  }

  await connectToDatabase();

  const scan = await Scan.create({
    userId: session.user.id,
    url: normalizedUrl,
    status: 'queued'
  });

  await Job.create({ type: 'scan', status: 'queued', payload: { url: normalizedUrl }, scanId: scan._id });

  // Extends this function invocation's lifetime past the response below,
  // so the scan actually runs to completion — this is what replaces the
  // standalone BullMQ worker process. There's no retry/backoff here (that
  // was BullMQ's job); a failed scan is simply marked "failed" and the
  // user can re-run it from the dashboard.
  waitUntil(runScanJob(scan._id.toString(), normalizedUrl));

  return NextResponse.json({ scanId: scan._id.toString(), status: 'queued' }, { status: 202 });
}

// History list for the logged-in user's dashboard.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  const scans = await Scan.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('url status overallScore categoryScores createdAt completedAt')
    .lean();

  return NextResponse.json({ scans });
}
