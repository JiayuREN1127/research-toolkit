'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const levels = [
  { key: 'topic', label: 'Level 1', title: 'Topic Abstraction', desc: '将具体现象抽象为一定主题类别' },
  { key: 'relationship', label: 'Level 2', title: 'Relationship Abstraction', desc: '将要素关系抽象为规律性关系' },
  { key: 'anomaly', label: 'Level 3', title: 'Anomaly Abstraction', desc: '找到现有理论无法解释的异常点' },
];

const ESTIMATED_MS = 10000;
const TICK_MS = 100;

export default function AbstractionTrainer() {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'level0' | 'level1' | 'level2' | 'summary'>('input');
  const [sourceText, setSourceText] = useState('');
  const [levelAbstractions, setLevelAbstractions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(ESTIMATED_MS / 1000);

  const callAI = useCallback(async (input: string, level: string) => {
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
      const res = await fetch('/api/abstraction-train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, level }),
      });
      const data = await res.json();
      clearInterval(timer);
      setProgress(100);
      setEta(0);
      setLoading(false);
      return data;
    } catch {
      clearInterval(timer);
      setLoading(false);
      alert('训练失败，请重试');
      return null;
    }
  }, []);

  const handleSubmitSource = async () => {
    const data = await callAI(sourceText, 'topic');
    if (data) {
      setFeedback(data);
      setStep('level0');
    }
  };

  const handleNextLevel = async (abstraction: string, nextIndex: number) => {
    setLevelAbstractions((prev) => [...prev, abstraction]);
    const nextLevel = nextIndex < 2 ? levels[nextIndex].key : 'summary';
    const data = await callAI(
      `${sourceText}\n\n已有抽象：\n${levelAbstractions.concat(abstraction).join('\n')}`,
      nextLevel,
    );
    if (data) {
      setFeedback(data);
      if (nextIndex === 0) setStep('level1');
      else if (nextIndex === 1) setStep('level2');
      else {
        setStep('summary');
        // Save to database
        const visitorId = Cookies.get('visitor_id') || '';
        const summary = {
          sourceText,
          levels: [...levelAbstractions, abstraction],
          feedback: data,
        };
        fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `abstraction-${Date.now()}`,
            visitorId,
            idea: summary.sourceText.slice(0, 200),
            questions: [],
            answers: [],
            checklist: [{ category: '抽象结果', point: summary.levels.join(' → '), reason: summary.feedback.summary || '', example: '', knowledgePoint: { session: 2, topic: 'Categorization & Abstraction 三种境界', concept: 'Topic → Relationship → Anomaly Abstraction', pdfFile: 'Week 2-Research Question and Contributions.pdf', pdfPage: 18 } }],
            mode: data.feedback ? 'llm' : 'mock',
            toolType: 'abstraction',
          }),
        }).catch(() => {});
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-6">AI 反馈生成中...</h2>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-100"
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

  if (step === 'summary' && feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <button onClick={() => router.push('/logic-coach')} className="text-sm text-slate-500 hover:text-slate-700">← 工具集</button>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-6">三级抽象总结</h1>
          <div className="space-y-6">
            {levels.map((l, i) => (
              <div key={l.key} className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-indigo-600 mb-2">{l.label}: {l.title}</h3>
                <p className="text-sm text-slate-700">{levelAbstractions[i]}</p>
              </div>
            ))}
            {feedback.summary && (
              <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h3 className="text-lg font-bold text-indigo-700 mb-2">整体评价</h3>
                <p className="text-sm text-indigo-800">{feedback.summary}</p>
              </div>
            )}
          </div>
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => {
                setStep('input');
                setSourceText('');
                setLevelAbstractions([]);
                setFeedback(null);
              }}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              重新开始
            </button>
            <button
              onClick={() => router.push('/logic-coach')}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              返回工具集
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentLevelIdx = ['level0', 'level1', 'level2'].indexOf(step);
  const currentLevel = levels[currentLevelIdx] || levels[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button onClick={() => router.push('/logic-coach')} className="text-sm text-slate-500 hover:text-slate-700">← 工具集</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {step === 'input' ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800">抽象思维训练</h1>
              <p className="mt-2 text-slate-500">
                输入一段新闻或具体现象描述，引导你完成 Topic → Relationship → Anomaly 三级抽象。
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              <label htmlFor="source" className="block text-sm font-semibold text-slate-700 mb-2">
                现象描述
              </label>
              <textarea
                id="source"
                rows={6}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none text-base"
                placeholder="例如：某互联网大厂取消了打卡制度后，员工满意度上升但项目交付质量下降..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmitSource}
                  disabled={!sourceText.trim()}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  开始抽象 →
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-8">
              {levels.map((l, i) => (
                <div key={l.key} className="flex items-center flex-1">
                  <div className={`flex-1 h-1 rounded ${i <= currentLevelIdx ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                </div>
              ))}
            </div>

            <div className="mb-6">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {currentLevel.label}
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">
                {currentLevel.title}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{currentLevel.desc}</p>
            </div>

            {/* AI feedback */}
            {feedback && (
              <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 mb-6">
                <p className="text-sm text-indigo-800 mb-2">
                  <span className="font-semibold">AI 反馈：</span>
                  {feedback.feedback}
                </p>
                {feedback.suggestion && (
                  <p className="text-sm text-indigo-700 mb-2">
                    <span className="font-semibold">建议：</span>
                    {feedback.suggestion}
                  </p>
                )}
                {feedback.exampleAbstraction && (
                  <p className="text-xs text-indigo-500 italic">
                    示例抽象：{feedback.exampleAbstraction}
                  </p>
                )}
              </div>
            )}

            {/* Source text */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
              <p className="text-xs font-semibold text-slate-500 mb-1">你的原始描述</p>
              <p className="text-sm text-slate-700">{sourceText}</p>
            </div>

            {/* Previous abstractions */}
            {levelAbstractions.length > 0 && (
              <div className="space-y-2 mb-6">
                {levelAbstractions.map((a, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500">{levels[i].label}: {levels[i].title}</p>
                    <p className="text-sm text-slate-700">{a}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Input for current level */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                你的 {currentLevel.label} 抽象
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                placeholder={currentLevel.key === 'topic' ? '这本质上是一个什么主题？' : currentLevel.key === 'relationship' ? 'X 和 Y 之间是什么类型的关系？' : '有什么现象是现有理论解释不了的？'}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    const textarea = document.querySelector('textarea:last-of-type') as HTMLTextAreaElement;
                    if (textarea && textarea.value.trim()) {
                      handleNextLevel(textarea.value.trim(), currentLevelIdx + 1);
                    }
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  {currentLevelIdx < 2 ? '提交并进入下一级 →' : '完成训练'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
