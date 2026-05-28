import { ChecklistItem } from './types';
import { ANALYZE_PROMPT, GENERATE_PROMPT } from './prompts';
import { knowledgePoints } from './data/knowledge';

const BASE_URL =
  process.env.OPENAI_BASE_URL || 'https://openapi.paratera.com/v1';
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.MODEL_NAME || 'GLM-Z1-Flash';

const TIMEOUT_MS = 30000; // 30s timeout

export async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`LLM API error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeIdea(idea: string): Promise<string[]> {
  const raw = await callLLM(ANALYZE_PROMPT, idea);
  try {
    const json = extractJson(raw);
    return json;
  } catch {
    return raw
      .split('\n')
      .filter((l) => l.trim().length > 5 && /[？?]$/.test(l.trim()))
      .slice(0, 5);
  }
}

export async function generateChecklist(
  idea: string,
  answers: string,
): Promise<ChecklistItem[]> {
  const userMsg = `用户的研究想法：${idea}\n\n补充回答：${answers}`;
  const raw = await callLLM(GENERATE_PROMPT, userMsg);
  try {
    const json = extractJson(raw);
    return json.map((item: any) => {
      // Look up concept from knowledge base
      const kp = knowledgePoints.find(
        (k) => k.session === item.refSession && k.topic === item.refTopic,
      );
      return {
        category: item.category,
        point: item.point,
        reason: item.reason,
        example: item.example || '',
        knowledgePoint: {
          session: item.refSession,
          topic: item.refTopic,
          concept: kp?.concept || '',
          pdfFile: kp?.pdfFile || item.refPdf || '',
          pdfPage: kp?.pdfPage || item.refPage || 0,
        },
      };
    });
  } catch {
    throw new Error('Failed to parse LLM response');
  }
}

export function extractJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {}
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    return JSON.parse(match[1]);
  }
  const arrMatch = raw.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    return JSON.parse(arrMatch[0]);
  }
  throw new Error('No valid JSON found');
}
