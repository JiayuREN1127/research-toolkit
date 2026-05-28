'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Checklist from '@/components/Checklist';
import type { ChecklistItem } from '@/lib/types';

export default function ProposalAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [data, setData] = useState<{
    proposal: string;
    diagnosis: ChecklistItem[];
    mode: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    params.then((p) => {
      const raw = sessionStorage.getItem(`proposal-${p.id}`);
      if (!raw) {
        router.push('/proposal');
        return;
      }
      const parsed = JSON.parse(raw);
      setData({
        proposal: parsed.proposal,
        diagnosis: parsed.diagnosis,
        mode: parsed.mode,
      });

      // Save to database (once per session)
      if (!parsed.saved) {
        const visitorId = Cookies.get('visitor_id') || '';
        fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `proposal-${p.id}`,
            visitorId,
            idea: parsed.proposal,
            questions: [],
            answers: [],
            checklist: parsed.diagnosis,
            mode: parsed.mode,
            toolType: 'proposal',
          }),
        }).catch(() => {});
        parsed.saved = true;
        sessionStorage.setItem(`proposal-${p.id}`, JSON.stringify(parsed));
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
              onClick={() => router.push('/idea-developer')}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Idea Developer
            </button>
            <h1 className="text-lg font-bold text-slate-800 mt-0.5">
              Proposal 诊断报告
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-slate-400">已保存</span>}
            <span className="text-xs px-2 py-1 rounded font-medium bg-violet-50 text-violet-700">
              {data.mode === 'llm' ? 'AI 诊断' : 'Mock Mode'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 mb-8">
          <p className="text-xs font-semibold text-violet-600 mb-1">你的 Proposal</p>
          <pre className="text-sm text-violet-800 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-48 overflow-y-auto">
            {data.proposal}
          </pre>
        </div>

        {/* Summary */}
        {data.diagnosis.length > 0 && (
          <div className="mb-6 flex gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
              {data.diagnosis.filter((d: any) => d.severity === 'error').length} 缺失
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
              {data.diagnosis.filter((d: any) => d.severity === 'warning').length} 不足
            </span>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
              {data.diagnosis.filter((d: any) => d.severity === 'ok').length} 良好
            </span>
          </div>
        )}

        <Checklist items={data.diagnosis} mode="diagnosis" />
      </div>
    </div>
  );
}
