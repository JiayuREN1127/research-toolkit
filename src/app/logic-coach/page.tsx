'use client';

import Link from 'next/link';

const trainers = [
  {
    title: '抽象思维训练',
    desc: '输入新闻/现象描述，完成 Topic → Relationship → Anomaly 三级抽象思维练习',
    href: '/train/abstraction',
    icon: '🧠',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    title: '因果推断沙盘',
    desc: '输入 X→Y 假设，交互式探索替代性解释和因果识别策略',
    href: '/train/causality',
    icon: '🎯',
    color: 'from-amber-500 to-amber-600',
  },
];

export default function LogicCoachPage() {
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
            Logic Coach
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            逻辑思维训练器 — 通过分步交互提升研究思维能力
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {trainers.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group block bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className={`h-2 bg-gradient-to-r ${t.color}`} />
              <div className="p-8">
                <div className="text-4xl mb-4">{t.icon}</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {t.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
