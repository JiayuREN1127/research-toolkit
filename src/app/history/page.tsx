'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Checklist from '@/components/Checklist';

const TOOL_TYPES = ['全部', '创意分析', 'Proposal 诊断', '研究设计检查', '抽象思维训练', '因果推断沙盘'];

const toolTypeIcons: Record<string, string> = {
  '创意分析': '💡',
  'Proposal 诊断': '📝',
  '研究设计检查': '🔬',
  '抽象思维训练': '🧠',
  '因果推断沙盘': '🎯',
};

const toolTypeLabels: Record<string, string> = {
  idea: '创意分析',
  proposal: 'Proposal 诊断',
  design: '研究设计检查',
  abstraction: '抽象思维训练',
  causality: '因果推断沙盘',
};

interface Submission {
  id: string;
  idea_id: string;
  idea: string;
  questions: string[];
  answers: string[];
  checklist: any[];
  mode: string;
  category: string;
  pinned: number;
  version: number;
  branch: string;
  parent_id: string | null;
  tool_type: string;
  created_at: string;
}

interface Thread {
  id: string;
  title: string;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTool, setFilterTool] = useState<string>('全部');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/submissions')
      .then((r) => r.json())
      .then((d) => {
        setSubmissions(d.submissions || []);
        setThreads(d.threads || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAction = async (action: string, id: string, category?: string) => {
    await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id, category }),
    });
    const r = await fetch('/api/submissions');
    const d = await r.json();
    setSubmissions(d.submissions || []);
    setThreads(d.threads || []);
    setEditingCategory(null);
  };

  // Group by tool_type
  const toolGroups = submissions.reduce<Record<string, Submission[]>>(
    (acc, s) => {
      const tt = s.tool_type || 'idea';
      const label = toolTypeLabels[tt] || '创意分析';
      if (!acc[label]) acc[label] = [];
      acc[label].push(s);
      return acc;
    },
    {},
  );

  const filtered = filterTool === '全部'
    ? submissions
    : submissions.filter((s) => (toolTypeLabels[s.tool_type || 'idea'] || '') === filterTool);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-slate-500">加载历史记录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← 返回平台首页
          </button>
          <h1 className="text-lg font-bold text-slate-800">历史记录</h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tool type filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TOOL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilterTool(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTool === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t !== '全部' && <span className="mr-1">{toolTypeIcons[t]}</span>}
              {t}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">还没有历史记录</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              开始使用
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(toolGroups).map(([toolLabel, items]) => {
              if (filterTool !== '全部' && filterTool !== toolLabel) return null;
              return (
                <div key={toolLabel} className="space-y-3">
                  {/* Tool group header */}
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-lg">{toolTypeIcons[toolLabel]}</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {toolLabel}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {items.length} 条记录
                    </span>
                  </div>

                  {/* Items */}
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${
                        s.pinned ? 'ring-2 ring-amber-300 bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Info bar */}
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs">
                        <span className="text-slate-400">
                          {s.created_at.replace('T', ' ').slice(0, 16)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={
                            s.mode === 'llm' ? 'text-green-600' : 'text-amber-600'
                          }
                        >
                          {s.mode === 'llm' ? 'AI' : 'Mock'}
                        </span>

                        <div className="flex-1" />

                        {/* Actions */}
                        <button
                          onClick={() => handleAction('pin', s.id)}
                          className="text-xs hover:text-amber-600"
                          title={s.pinned ? '取消置顶' : '置顶'}
                        >
                          {s.pinned ? '★' : '☆'}
                        </button>
                        <button
                          onClick={() => handleAction('delete', s.id)}
                          className="text-xs text-slate-400 hover:text-red-600"
                          title="删除"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Content */}
                      <button
                        onClick={() =>
                          setExpanded(expanded === s.id ? null : s.id)
                        }
                        className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-700 line-clamp-2">
                          {s.idea}
                        </p>
                        {expanded === s.id && (
                          <div className="mt-4 space-y-5">
                            {/* Questions & Answers (idea type only) */}
                            {s.tool_type === 'idea' && s.questions && s.questions.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">
                                  澄清问题与回答
                                </p>
                                <div className="space-y-2">
                                  {s.questions.map((q: string, i: number) => (
                                    <div key={i} className="text-sm">
                                      <p className="text-slate-600 font-medium">
                                        Q{i + 1}: {q}
                                      </p>
                                      <p className="text-slate-400 ml-4">
                                        {s.answers?.[i] || '—'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Checklist / Diagnosis */}
                            {s.checklist && s.checklist.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">
                                  {s.tool_type === 'proposal' ? '诊断报告' : '检查清单'}
                                </p>
                                <Checklist
                                  items={s.checklist}
                                  mode={s.tool_type === 'proposal' ? 'diagnosis' : 'checklist'}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
