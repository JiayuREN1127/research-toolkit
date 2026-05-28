'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Checklist from '@/components/Checklist';
import type { ChecklistItem } from '@/lib/types';

export default function DesignAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [data, setData] = useState<{
    design: string;
    checklist: ChecklistItem[];
    mode: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    params.then((p) => {
      const raw = sessionStorage.getItem(`design-${p.id}`);
      if (!raw) {
        router.push('/design');
        return;
      }
      const parsed = JSON.parse(raw);
      setData({
        design: parsed.design,
        checklist: parsed.checklist,
        mode: parsed.mode,
      });

      // Save to database (once per session)
      if (!parsed.saved) {
        const visitorId = Cookies.get('visitor_id') || '';
        fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `design-${p.id}`,
            visitorId,
            idea: parsed.design,
            questions: [],
            answers: [],
            checklist: parsed.checklist,
            mode: parsed.mode,
            toolType: 'design',
          }),
        }).catch(() => {});
        parsed.saved = true;
        sessionStorage.setItem(`design-${p.id}`, JSON.stringify(parsed));
        setSaved(true);
      }
    });
  }, [params, router]);

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/research-toolkit')}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Research Toolkit
            </button>
            <h1 className="text-lg font-bold text-slate-800 mt-0.5">
              研究设计检查清单
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-slate-400">已保存</span>}
            <span className="text-xs px-2 py-1 rounded font-medium bg-emerald-50 text-emerald-700">
              {data.mode === 'llm' ? 'AI 生成' : 'Mock Mode'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-8">
          <p className="text-xs font-semibold text-emerald-600 mb-1">你的研究设计</p>
          <pre className="text-sm text-emerald-800 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-48 overflow-y-auto">
            {data.design}
          </pre>
        </div>

        <Checklist items={data.checklist} />
      </div>
    </div>
  );
}
