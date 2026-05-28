import { NextRequest, NextResponse } from 'next/server';
import { getDb, SubmissionRow } from '@/lib/db';
import { createHash } from 'crypto';

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

function checkAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return !!(ADMIN_PASSWORD_HASH && cookie === ADMIN_PASSWORD_HASH);
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = parseInt(url.searchParams.get('per_page') || '20');
  const offset = (page - 1) * perPage;

  const total = (db.prepare('SELECT COUNT(*) as c FROM submissions').get() as any).c;
  const rows = db
    .prepare(
      `SELECT * FROM submissions ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(perPage, offset) as SubmissionRow[];

  const submissions = rows.map((r) => ({
    ...r,
    questions: JSON.parse(r.questions_json),
    answers: JSON.parse(r.answers_json),
    checklist: JSON.parse(r.checklist_json),
  }));

  return NextResponse.json({
    submissions,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}

export async function GET_LOGS(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = parseInt(url.searchParams.get('per_page') || '50');
  const offset = (page - 1) * perPage;

  const total = (db.prepare('SELECT COUNT(*) as c FROM access_logs').get() as any).c;
  const rows = db
    .prepare(
      `SELECT * FROM access_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(perPage, offset);

  return NextResponse.json({ logs: rows, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}
