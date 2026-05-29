'use client';

import { useState } from 'react';
import { Message } from '../lib/types';

interface ChatViewProps {
  idea: string;
  questions: string[];
  answers: string[];
  onAnswersSubmit: (answers: string[]) => void;
  onBack: () => void;
  mode?: string;
}

export default function ChatView({
  idea,
  questions,
  answers,
  onAnswersSubmit,
  onBack,
  mode = 'mock',
}: ChatViewProps) {
  const [localAnswers, setLocalAnswers] = useState<string[]>(
    Array(questions.length).fill(''),
  );

  const updateAnswer = (index: number, value: string) => {
    setLocalAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const allFilled = localAnswers.every((a) => a.trim().length > 0);

  const messages: Message[] = [
    {
      role: 'assistant' as const,
      content: `我收到了您的研究想法。为了更好地帮助您发展这个想法，我需要了解一些关键细节。请回答以下问题：`,
      timestamp: Date.now() - 1000,
    },
    ...questions.flatMap((q, i) => [
      {
        role: 'assistant' as const,
        content: `**Q${i + 1}**: ${q}`,
        timestamp: Date.now(),
      },
    ]),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← 返回
            </button>
            <h1 className="text-lg font-bold text-slate-800 mt-0.5">
              研究想法发展
            </h1>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded font-medium ${
              mode === 'llm'
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {mode === 'llm' ? 'GLM-Z1-Flash' : 'Mock Mode'}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Idea summary */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-semibold text-blue-600 mb-1">您的想法</p>
          <p className="text-sm text-blue-800">{idea}</p>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-2">
                  {i + 1}
                </span>
                {q}
              </p>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                placeholder="回答..."
                value={localAnswers[i]}
                onChange={(e) => updateAnswer(i, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end pb-8">
          <button
            onClick={() => onAnswersSubmit(localAnswers)}
            disabled={!allFilled}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            提交回答，生成 Checklist →
          </button>
        </div>
      </div>
    </div>
  );
}
