import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { method: m, path: p } = await req.json();
  const visitorId = req.cookies.get('visitor_id')?.value ?? null;
  const ip =
    req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for') ?? null;
  const ua = req.headers.get('user-agent') ?? null;

  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO access_logs (visitor_id, method, path, ip, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(visitorId, m || 'GET', p || '/', ip, ua);
  } catch {
    // best-effort logging, don't fail the request
  }

  return NextResponse.json({ ok: true });
}
