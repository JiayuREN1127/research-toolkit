'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const stages = [
  { key: 'alternatives', label: '第一步', title: '列出替代性解释', icon: '⚠️', desc: '您的 X→Y 关系，还有什么其他可能的原因？' },
  { key: 'evaluate', label: '第二步', title: '评估替代性解释', icon: '🔍', desc: '逐一考虑每个替代性解释是否构成严重威胁' },
  { key: 'strategies', label: '第三步', title: '匹配识别策略', icon: '🎯', desc: '为未能排除的威胁匹配合适的因果识别策略' },
];

const ESTIMATED_MS = 12000;
const TICK_MS = 100;

export default function CausalitySandbox() {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [hypothesis, setHypothesis] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(ESTIMATED_MS / 1000);

  const callAI = useCallback(async (stageKey: string, text: string) => {
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
      const res = await fetch('/api/causality-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesis: text, stage: stageKey }),
      });
      const result = await res.json();
      clearInterval(timer);
      setProgress(100);
      setEta(0);
      setLoading(false);
      return result;
    } catch {
      clearInterval(timer);
      setLoading(false);
      alert('分析失败，请重试');
      return null;
    }
  }, []);

  const handleSubmitHypothesis = async () => {
    const result = await callAI('alternatives', hypothesis);
    if (result) {
      setData(result);
      setStage(1);
    }
  };

  const handleNextStage = async () => {
    if (stage === 1) {
      const result = await callAI('evaluate', hypothesis);
      if (result) {
        setData(result);
        setStage(2);
      }
    } else if (stage === 2) {
      const result = await callAI('strategies', hypothesis);
      if (result) {
        setData(result);
        setStage(3);
        // Save to database
        const visitorId = Cookies.get('visitor_id') || '';
        fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `causality-${Date.now()}`,
            visitorId,
            idea: hypothesis,
            questions: [],
            answers: [],
            checklist: (result.items || []).map((item: any) => ({
              category: '因果识别',
              point: item.name,
              reason: item.description,
              example: `如何应对：${item.howToAddress}`,
              severity: item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'ok',
              knowledgePoint: { session: 9, topic: '建立因果关系的三条件', concept: 'X precedes Y; X and Y co-vary; Rule out alternative explanations', pdfFile: 'Week 9-Experimental Prototype (I).pdf', pdfPage: 8 },
            })),
            mode: result.items ? 'llm' : 'mock',
            toolType: 'causality',
          }),
        }).catch(() => {});
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-6">分析中...</h2>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-amber-600 rounded-full transition-all duration-100"
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

  const currentStage = stages[stage] || stages[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button onClick={() => router.push('/logic-coach')} className="text-sm text-slate-500 hover:text-slate-700">← 工具集</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {stage === 0 ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800">因果推断沙盘</h1>
              <p className="mt-2 text-slate-500">
                输入您的 X→Y 因果假设，系统帮您探索替代性解释、评估威胁、匹配识别策略。
              </p>
            </div>

            {/* Stage indicators */}
            <div className="flex gap-3 mb-8">
              {stages.map((s, i) => (
                <div
                  key={s.key}
                  className={`flex-1 text-center py-3 rounded-xl text-sm font-medium transition-colors ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <div className="mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              <label htmlFor="hypothesis" className="block text-sm font-semibold text-slate-700 mb-2">
                因果假设
              </label>
              <textarea
                id="hypothesis"
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100 resize-none text-base"
                placeholder="例如：远程办公（X）通过提升员工自主性进而提升创造力（Y）..."
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
              />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmitHypothesis}
                  disabled={!hypothesis.trim()}
                  className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  开始分析 →
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Stage indicators */}
            <div className="flex gap-3 mb-8">
              {stages.map((s, i) => (
                <div
                  key={s.key}
                  className={`flex-1 text-center py-3 rounded-xl text-sm font-medium transition-colors ${
                    i < stage ? 'bg-green-100 text-green-700' : i === stage ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <div className="mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Hypothesis */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-6">
              <p className="text-xs font-semibold text-amber-600 mb-1">您的假设</p>
              <p className="text-sm text-amber-800">{hypothesis}</p>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span>{currentStage.icon}</span>
              {currentStage.title}
            </h2>
            <p className="text-sm text-slate-500 mb-6">{currentStage.desc}</p>

            {/* AI output */}
            {data && (
              <div className="space-y-4 mb-8">
                {data.items?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className={`bg-white rounded-xl border p-5 ${
                      item.severity === 'high'
                        ? 'border-red-200 bg-red-50'
                        : item.severity === 'medium'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                      {item.severity && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          item.severity === 'high' ? 'bg-red-100 text-red-700' :
                          item.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {item.severity === 'high' ? '高威胁' : item.severity === 'medium' ? '中威胁' : '低威胁'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                    <p className="text-xs text-slate-400 mt-2 bg-white/50 rounded px-3 py-1.5 border border-slate-100">
                      如何应对：{item.howToAddress}
                    </p>
                  </div>
                ))}

                {data.summary && (
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <p className="text-sm text-slate-700">{data.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Next button */}
            {stage < 3 && (
              <div className="flex justify-end">
                <button
                  onClick={handleNextStage}
                  className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors"
                >
                  {stage === 2 ? '完成分析' : '进入下一步 →'}
                </button>
              </div>
            )}

            {stage === 3 && (
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setStage(0);
                    setHypothesis('');
                    setData(null);
                  }}
                  className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors"
                >
                  新的假设
                </button>
                <button
                  onClick={() => router.push('/logic-coach')}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  返回工具集
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
