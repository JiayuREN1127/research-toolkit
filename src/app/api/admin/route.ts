import { NextRequest, NextResponse } from 'next/server';
import { getDb, SubmissionRow } from '@/lib/db';
import { createHash } from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  '7b7e50019751c38fe485b2c7c210c4add4daef8857f27f0952bb4d100ade31b0';

function checkAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return !!(ADMIN_PASSWORD_HASH && cookie === ADMIN_PASSWORD_HASH);
}

// POST: login
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const hash = createHash('sha256').update(password).digest('hex');

  if (username !== ADMIN_USERNAME || hash !== ADMIN_PASSWORD_HASH) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', hash, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  return res;
}

// GET: check auth status
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'submissions';

  if (type === 'logs') {
    const rows = db
      .prepare('SELECT * FROM access_logs ORDER BY created_at DESC LIMIT 200')
      .all();
    return NextResponse.json({ logs: rows });
  }

  // submissions
  const rows = db
    .prepare('SELECT * FROM submissions ORDER BY pinned DESC, created_at DESC')
    .all() as SubmissionRow[];

  const submissions = rows.map((r) => ({
    ...r,
    questions: JSON.parse(r.questions_json),
    answers: JSON.parse(r.answers_json),
    checklist: JSON.parse(r.checklist_json),
  }));

  return NextResponse.json({ submissions });
}
