import { NextRequest, NextResponse } from 'next/server';
import { generateMockQuestions } from '@/lib/data/mock-responses';
import { analyzeIdea } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { idea } = await req.json();

  if (!idea || typeof idea !== 'string') {
    return NextResponse.json({ error: 'idea is required' }, { status: 400 });
  }

  // Try LLM API first, fall back to mock
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const questions = await analyzeIdea(idea);
      return NextResponse.json({ questions, mode: 'claude' });
    } catch {
      // fall through to mock
    }
  }

  const questions = generateMockQuestions(idea);
  return NextResponse.json({ questions, mode: 'mock' });
}
