import { NextRequest, NextResponse } from 'next/server';
import { generateMockChecklist } from '@/lib/data/mock-responses';
import { generateChecklist } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { idea, answers } = await req.json();

  if (!idea || typeof idea !== 'string') {
    return NextResponse.json({ error: 'idea is required' }, { status: 400 });
  }

  const answersStr = Array.isArray(answers) ? answers.join('\n') : answers || '';

  // Try LLM API first, fall back to mock
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const checklist = await generateChecklist(idea, answersStr);
      return NextResponse.json({ checklist, mode: 'claude' });
    } catch {
      // fall through to mock
    }
  }

  const checklist = generateMockChecklist(idea, answersStr);
  return NextResponse.json({ checklist, mode: 'mock' });
}
