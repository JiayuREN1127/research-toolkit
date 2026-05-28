import { NextRequest, NextResponse } from 'next/server';
import { getDb, SubmissionRow } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { id, visitorId, idea, questions, answers, checklist, mode, parentId, toolType } =
    await req.json();

  if (!id || !visitorId || !idea) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for') ?? null;
  const ua = req.headers.get('user-agent') ?? null;

  // Git-like: find idea_id and version
  let ideaId = '';
  let versionNum = 1;
  let branchName = 'main';

  if (parentId) {
    const parent = db
      .prepare('SELECT idea_id, version, branch FROM submissions WHERE id = ?')
      .get(parentId) as { idea_id: string; version: number; branch: string } | undefined;
    if (parent) {
      ideaId = parent.idea_id;
      versionNum = parent.version + 1;
      branchName = parent.branch;
    }
  }

  if (!ideaId) {
    ideaId = `idea-${visitorId}-${Date.now()}`;
    // Create new idea thread
    db.prepare('INSERT INTO idea_threads (id, visitor_id, title) VALUES (?, ?, ?)').run(
      ideaId,
      visitorId,
      idea.slice(0, 80),
    );
  }

  db.prepare(
    `INSERT INTO submissions (id, idea_id, visitor_id, parent_id, version, branch, idea, questions_json, answers_json, checklist_json, mode, tool_type, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    ideaId,
    visitorId,
    parentId || null,
    versionNum,
    branchName,
    idea,
    JSON.stringify(questions),
    JSON.stringify(answers),
    JSON.stringify(checklist),
    mode || 'mock',
    toolType || 'idea',
    ip,
    ua,
  );

  return NextResponse.json({ ok: true, ideaId, version: versionNum });
}

export async function GET(req: NextRequest) {
  const visitorId = req.cookies.get('visitor_id')?.value;
  if (!visitorId) {
    return NextResponse.json({ submissions: [], threads: [] });
  }

  const db = getDb();

  // Get idea threads
  const threads = db
    .prepare(
      `SELECT id, title, created_at FROM idea_threads WHERE visitor_id = ? ORDER BY created_at DESC`,
    )
    .all(visitorId) as { id: string; title: string; created_at: string }[];

  // Get submissions (non-deleted), pinned first then by created_at
  const rows = db
    .prepare(
      `SELECT * FROM submissions WHERE visitor_id = ? AND deleted = 0 ORDER BY pinned DESC, created_at DESC`,
    )
    .all(visitorId) as SubmissionRow[];

  const submissions = rows.map((r) => ({
    id: r.id,
    idea_id: r.idea_id,
    idea: r.idea,
    questions: JSON.parse(r.questions_json),
    answers: JSON.parse(r.answers_json),
    checklist: JSON.parse(r.checklist_json),
    mode: r.mode,
    category: r.category,
    pinned: r.pinned,
    version: r.version,
    branch: r.branch,
    parent_id: r.parent_id,
    tool_type: r.tool_type,
    created_at: r.created_at,
  }));

  return NextResponse.json({ submissions, threads });
}

// Manage: delete, pin, category
export async function PATCH(req: NextRequest) {
  const { action, id, category } = await req.json();
  const visitorId = req.cookies.get('visitor_id')?.value;

  if (!id || !visitorId) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const db = getDb();

  if (action === 'delete') {
    db.prepare('UPDATE submissions SET deleted = 1 WHERE id = ? AND visitor_id = ?').run(
      id,
      visitorId,
    );
  } else if (action === 'pin') {
    db.prepare('UPDATE submissions SET pinned = 1 - pinned WHERE id = ? AND visitor_id = ?').run(
      id,
      visitorId,
    );
  } else if (action === 'category' && category) {
    db.prepare('UPDATE submissions SET category = ? WHERE id = ? AND visitor_id = ?').run(
      category,
      id,
      visitorId,
    );
  }

  return NextResponse.json({ ok: true });
}
