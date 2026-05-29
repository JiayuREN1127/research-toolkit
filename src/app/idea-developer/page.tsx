'use client';

import Link from 'next/link';

const modules = [
  {
    title: '1. 创意分析',
    desc: '输入研究想法，获得澄清问题和发展 Checklist',
    href: '/idea',
    color: 'from-blue-500 to-blue-600',
    icon: '💡',
  },
  {
    title: '2. Proposal 诊断',
    desc: '粘贴 Proposal 草稿，对照三大要素诊断缺失项和 SO WHAT',
    href: '/proposal',
    color: 'from-violet-500 to-violet-600',
    icon: '📝',
  },
  {
    title: '3. 研究设计检查',
    desc: '描述研究设计，按方法类型生成效度检查清单',
    href: '/design',
    color: 'from-emerald-500 to-emerald-600',
    icon: '🔬',
  },
];

export default function IdeaDeveloperPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← 返回平台首页</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
            Idea Developer
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            研究发展工具集 — 基于管理研究方法论体系
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group block bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className={`h-2 bg-gradient-to-r ${m.color}`} />
              <div className="p-6">
                <div className="text-3xl mb-3">{m.icon}</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {m.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
