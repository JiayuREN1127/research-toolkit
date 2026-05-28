'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatView from '@/components/ChatView';
import Checklist from '@/components/Checklist';
import { ChecklistItem } from '@/lib/types';

const ESTIMATED_MS = 15000;
const TICK_MS = 100;

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [conversation, setConversation] = useState<any>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'clarifying' | 'done'>('clarifying');
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(ESTIMATED_MS / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    params.then((p) => {
      const raw = sessionStorage.getItem(`conv-${p.id}`);
      if (!raw) {
        router.push('/');
        return;
      }
      setConversation(JSON.parse(raw));
    });
  }, [params, router]);

  const handleAnswersSubmit = async (answers: string[]) => {
    setLoading(true);
    setProgress(0);
    setEta(ESTIMATED_MS / 1000);
    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(elapsed / ESTIMATED_MS, 0.95);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));
      setEta(Math.max(0, Math.round((ESTIMATED_MS - elapsed) / 1000)));
    }, TICK_MS);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: conversation.idea,
          answers,
        }),
      });
      const data = await res.json();
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setEta(0);
      setChecklist(data.checklist);
      setPhase('done');

      // Save to database
      try {
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: conversation.id,
            visitorId: conversation.visitorId || '',
            idea: conversation.idea,
            questions: conversation.questions,
            answers,
            checklist: data.checklist,
            mode: data.mode,
            toolType: conversation.toolType || 'idea',
          }),
        });
      } catch {
        // best-effort save, don't break the flow
      }
    } catch {
      if (timerRef.current) clearInterval(timerRef.current);
      alert('生成失败，请重试');
      setLoading(false);
    }
  };

  if (!conversation) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            生成你的想法发展 Checklist...
          </h2>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-400">
            {progress}%{eta > 0 && ` · 预计还剩 ${eta}s`}
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/idea-developer')}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Idea Developer
              </button>
              <h1 className="text-lg font-bold text-slate-800 mt-0.5">
                想法发展 Checklist
              </h1>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded font-medium ${
                conversation.mode === 'claude'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {conversation.mode === 'claude' ? 'Claude AI' : 'Mock Mode'}
            </span>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-8">
            <p className="text-xs font-semibold text-blue-600 mb-1">你的想法</p>
            <p className="text-sm text-blue-800">{conversation.idea}</p>
          </div>

          <Checklist items={checklist} />
        </div>
      </div>
    );
  }

  return (
    <ChatView
      idea={conversation.idea}
      questions={conversation.questions || []}
      answers={[]}
      onAnswersSubmit={handleAnswersSubmit}
      onBack={() => router.push('/')}
      mode={conversation.mode}
    />
  );
}
