'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ESTIMATED_MS = 15000;
const TICK_MS = 100;

export default function DesignPage() {
  const router = useRouter();
  const [design, setDesign] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(ESTIMATED_MS / 1000);

  const handleSubmit = async () => {
    if (!design.trim()) return;
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
      const res = await fetch('/api/design-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design }),
      });
      const data = await res.json();

      clearInterval(timer);
      setProgress(100);
      setEta(0);

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(
        `design-${id}`,
        JSON.stringify({ id, design, checklist: data.checklist, mode: data.mode }),
      );
      router.push(`/design/analysis/${id}`);
    } catch {
      clearInterval(timer);
      alert('检查失败，请重试');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-6">检查研究设计...</h2>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-100"
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
          <a href="/research-toolkit" className="text-sm text-slate-500 hover:text-slate-700">← 返回 Research Toolkit</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">研究设计检查</h1>
          <p className="mt-2 text-slate-500">
            描述你的研究设计，系统将根据方法类型生成针对性的效度检查清单。
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <label htmlFor="design" className="block text-sm font-semibold text-slate-700 mb-2">
            研究设计描述
          </label>
          <textarea
            id="design"
            rows={12}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none text-base"
            placeholder={`建议包含以下信息（越详细越好）：

【核心假设】
X → Y 的因果关系假设是什么？

【研究方法】
你打算用什么方法？（实验 / 二手数据 / 调查 / 访谈 / 混合方法 / 定性）

【样本与情境】
目标样本是什么？在什么情境下收集数据？

【变量操作化】
关键变量如何测量？

【因果识别策略】（如适用）
如何排除替代性解释？`}
            value={design}
            onChange={(e) => setDesign(e.target.value)}
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!design.trim()}
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              生成检查清单 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
