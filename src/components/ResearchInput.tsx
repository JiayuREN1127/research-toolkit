'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ResearchInputProps {
  onSubmit: (idea: string) => void;
}

export default function ResearchInput({ onSubmit }: ResearchInputProps) {
  const [idea, setIdea] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
            Research Toolkit
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            研究想法发展助手 — 基于管理研究方法论体系
          </p>
          <Link
            href="/history"
            className="mt-2 inline-block text-sm text-blue-500 hover:text-blue-700"
          >
            查看历史记录 →
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <label
            htmlFor="idea"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            描述你的研究想法
          </label>
          <textarea
            id="idea"
            rows={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none text-base"
            placeholder="例如：我想研究远程办公对员工创造力的影响，假设自主性在其中起中介作用..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                if (idea.trim()) onSubmit(idea.trim());
              }}
              disabled={!idea.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              开始发展想法 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
