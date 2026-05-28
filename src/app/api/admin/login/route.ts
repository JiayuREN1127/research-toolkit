import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || '';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const hash = createHash('sha256').update(password).digest('hex');

  if (ADMIN_PASSWORD_HASH && hash !== ADMIN_PASSWORD_HASH) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', hash, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  });
  return res;
}
