'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ESTIMATED_MS = 15000;
const TICK_MS = 100;

export default function ProposalPage() {
  const router = useRouter();
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(ESTIMATED_MS / 1000);

  const handleSubmit = async () => {
    if (!proposal.trim()) return;
    setLoading(true);
    setProgress(0);
    setEta(ESTIMATED_MS / 1000);
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(elapsed / ESTIMATED_MS, 0.95);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));
      setEta(Math.max(0, Math.round((ESTIMATED_MS - elapsed) / 1000)));
    }, TICK_MS);

    try {
      const res = await fetch('/api/proposal-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal }),
      });
      const data = await res.json();

      clearInterval(timer);
      setProgress(100);
      setEta(0);

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(
        `proposal-${id}`,
        JSON.stringify({ id, proposal, diagnosis: data.diagnosis, mode: data.mode }),
      );
      router.push(`/proposal/analysis/${id}`);
    } catch {
      clearInterval(timer);
      alert('诊断失败，请重试');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-6">诊断 Proposal...</h2>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-100"
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/idea-developer" className="text-sm text-slate-500 hover:text-slate-700">← 返回 Idea Developer</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Proposal 诊断</h1>
          <p className="mt-2 text-slate-500">
            粘贴你的 Proposal 草稿，系统将对照三大要素（What do we know / What don't we know / So what）进行诊断，同时评估研究问题质量。
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <label htmlFor="proposal" className="block text-sm font-semibold text-slate-700 mb-2">
            Proposal 草稿
          </label>
          <textarea
            id="proposal"
            rows={14}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none text-base font-mono text-sm"
            placeholder={`建议包含以下部分（可选）：

【研究问题】
你的研究问题是什么？

【What do we know】
已有文献的理解和关键发现...

【What don't we know】
已有答案的不足和矛盾之处...

【So what】
你的研究为什么重要？将如何改变、挑战或推进已有理解？

【假设】
你的假设或命题...`}
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!proposal.trim()}
              className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              开始诊断 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
