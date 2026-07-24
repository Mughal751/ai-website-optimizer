import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().min(1).max(60).optional()
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;
  await connectToDatabase();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Admin role is only ever granted via the seed script reading
  // ADMIN_SEED_EMAIL server-side — never here, never from client input.
  const user = await User.create({
    email: email.toLowerCase().trim(),
    name: name ?? null,
    passwordHash,
    role: 'user'
  });

  return NextResponse.json({ id: user._id.toString(), email: user.email }, { status: 201 });
}