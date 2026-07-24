import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

const UpdateNameSchema = z.object({ name: z.string().trim().min(1).max(60) });

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid name is required' }, { status: 400 });
  }

  await connectToDatabase();
  await User.findByIdAndUpdate(session.user.id, { name: parsed.data.name });

  return NextResponse.json({ name: parsed.data.name });
}