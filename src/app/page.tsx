'use client';

import Link from 'next/link';

const products = [
  {
    title: 'Idea Developer',
    subtitle: '研究发展工具集',
    desc: '基于管理研究方法论体系，覆盖"想法 → Proposal → 研究设计"全流程',
    href: '/idea-developer',
    color: 'from-blue-500 to-violet-600',
    icon: '💡',
    modules: ['创意分析', 'Proposal 诊断', '研究设计检查'],
  },
  {
    title: 'Logic Coach',
    subtitle: '逻辑思维训练器',
    desc: '通过分步交互训练抽象思维能力和因果推断能力',
    href: '/logic-coach',
    color: 'from-indigo-500 to-emerald-600',
    icon: '🧩',
    modules: ['抽象思维训练', '因果推断沙盘'],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
            人机协同设计平台
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            基于管理研究方法论体系 — 清华大学经管 Research Methods I
          </p>
        </div>

        {/* Product cards */}
        <div className="grid gap-8 sm:grid-cols-2">
          {products.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group block bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <div className={`h-2 bg-gradient-to-r ${p.color}`} />
              <div className="p-8">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h2 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {p.title}
                </h2>
                <p className="text-sm text-violet-500 font-medium mt-0.5 mb-3">
                  {p.subtitle}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {p.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.modules.map((m) => (
                    <span
                      key={m}
                      className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/history"
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            查看历史记录 →
          </Link>
        </div>
      </div>
    </div>
  );
}
