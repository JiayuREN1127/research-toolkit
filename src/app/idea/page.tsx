'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import IdeaInput from '@/components/IdeaInput';

const ESTIMATED_MS = 12000;
const TICK_MS = 100;

export default function IdeaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(ESTIMATED_MS / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let vid = Cookies.get('visitor_id');
    if (!vid) {
      vid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      Cookies.set('visitor_id', vid, { expires: 365 });
    }
    setReady(true);
  }, []);

  const handleSubmit = async (idea: string) => {
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
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();

      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setEta(0);

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const visitorId = Cookies.get('visitor_id') || '';
      sessionStorage.setItem(
        `conv-${id}`,
        JSON.stringify({
          id,
          phase: 'clarifying',
          idea,
          questions: data.questions,
          mode: data.mode,
          visitorId,
          toolType: 'idea',
        }),
      );
      router.push(`/chat/${id}`);
    } catch {
      if (timerRef.current) clearInterval(timerRef.current);
      alert('请求失败，请重试');
      setLoading(false);
    }
  };

  if (!ready) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            分析你的研究想法...
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/idea-developer" className="text-sm text-slate-500 hover:text-slate-700">
            ← 返回 Idea Developer
          </a>
        </div>
      </header>
      <IdeaInput onSubmit={handleSubmit} />
    </div>
  );
}
