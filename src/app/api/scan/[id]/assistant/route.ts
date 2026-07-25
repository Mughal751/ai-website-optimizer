import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb'; 
import { Scan } from '@/models/Scan';
import { checkRateLimit } from '@/lib/rateLimit';

const AskSchema = z.object({ question: z.string().min(1).max(2000) });

// GEMINI_API_KEY is read only here, server-side. It is never sent to the
// client and the SDK is never imported from any client component.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: 'Invalid scan id' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A question is required' }, { status: 400 });
  }

  const rateLimit = await checkRateLimit(`assistant:${session.user.id}`, 20, 60 * 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rateLimit.resetSeconds}s.` },
      { status: 429 }
    );
  }

  await connectToDatabase();
  const scan = await Scan.findById(params.id).lean();
  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }
  if (scan.userId.toString() !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (scan.status !== 'complete') {
    return NextResponse.json({ error: 'Scan is not complete yet' }, { status: 409 });
  }

  const scanContext = {
    url: scan.url,
    overallScore: scan.overallScore,
    categoryScores: scan.categoryScores,
    recommendations: scan.recommendations
  };

  try {
    const response = await ai.models.generateContent({
     model: 'gemini-3.5-flash-lite',
      contents: `You are a website optimization assistant. Answer the user's question using ONLY the structured scan data below as ground truth. Be specific and reference the actual detected issues, scores, and recommendations. If the data does not contain enough information to answer, say so plainly rather than guessing.

Scan data:
${JSON.stringify(scanContext, null, 2)}

Question: ${parsed.data.question}`
    });

    const answer = response.text ?? '';

    return NextResponse.json({ answer });
  } catch (err) {
    console.error('[assistant] Gemini API error:', err);
    return NextResponse.json(
      { error: 'The assistant is temporarily unavailable. Please try again shortly.' },
      { status: 502 }
    );
  }
}
