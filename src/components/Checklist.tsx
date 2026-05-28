'use client';

import { useState } from 'react';
import type { Severity } from '@/lib/types';

// Supports both old format (question, knowledgePoints[]) and new format (point, reason, example, knowledgePoint)
interface ChecklistItemCompat {
  category: string;
  // New format
  point?: string;
  reason?: string;
  example?: string;
  suggestion?: string;
  severity?: Severity;
  knowledgePoint?: {
    session: number;
    topic: string;
    concept: string;
    pdfFile: string;
    pdfPage: number;
  };
  // Old format
  question?: string;
  knowledgePoints?: {
    session: number;
    topic: string;
    pdfFile: string;
    pdfPage: number;
  }[];
}

interface ChecklistProps {
  items: ChecklistItemCompat[];
  mode?: 'checklist' | 'diagnosis';
}

const categoryIcons: Record<string, string> = {
  研究问题质量: '🔍',
  文献综述: '📚',
  文献综述完整性: '📚',
  方法决策: '🔬',
  因果识别: '🎯',
  理论贡献: '💡',
  贡献定位: '💡',
  逻辑一致性: '🔗',
  研究空白: '🕳️',
  'SO WHAT 诊断': '❗',
  研究设计完整性: '📐',
  方法适配性: '⚙️',
  效度保障: '🛡️',
};

const severityConfig: Record<Severity, { color: string; label: string; bg: string; border: string }> = {
  error: { color: 'text-red-700', label: '缺失', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { color: 'text-amber-700', label: '不足', bg: 'bg-amber-50', border: 'border-amber-200' },
  ok: { color: 'text-green-700', label: '良好', bg: 'bg-green-50', border: 'border-green-200' },
};

export default function Checklist({ items, mode = 'checklist' }: ChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const grouped = items.reduce<Record<string, ChecklistItemCompat[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category}>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span>{categoryIcons[category] || '📋'}</span>
            {category}
            <span className="text-xs font-normal text-slate-400">
              ({catItems.filter((_, i) => checked.has(`${category}-${i}`)).length}/
              {catItems.length})
            </span>
            {mode === 'diagnosis' && (
              <span className="ml-auto flex gap-1 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                  {catItems.filter((i) => i.severity === 'error').length}缺
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">
                  {catItems.filter((i) => i.severity === 'warning').length}不足
                </span>
                <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-600">
                  {catItems.filter((i) => i.severity === 'ok').length}良好
                </span>
              </span>
            )}
          </h3>
          <div className="space-y-4">
            {catItems.map((item, i) => {
              const key = `${category}-${i}`;
              const isChecked = checked.has(key);
              const isOldFormat = !item.point && item.question;

              return (
                <div
                  key={key}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isChecked
                      ? `${severityConfig[item.severity || 'ok'].bg} ${severityConfig[item.severity || 'ok'].border} opacity-70`
                      : `bg-white border-slate-200 hover:border-blue-100`
                  }`}
                >
                  <label className="flex items-start gap-3 p-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(key)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {/* Severity badge (diagnosis mode only) */}
                      {mode === 'diagnosis' && item.severity && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2 ${severityConfig[item.severity].bg} ${severityConfig[item.severity].color}`}>
                          {severityConfig[item.severity].label}
                        </span>
                      )}
                      {/* Point / Question */}
                      <p
                        className={`text-sm font-semibold leading-relaxed ${
                          isChecked
                            ? `${severityConfig[item.severity || 'ok'].color} line-through opacity-70`
                            : 'text-slate-800'
                        }`}
                      >
                        {isOldFormat ? item.question : item.point}
                      </p>

                      {/* Reason (new format only) */}
                      {!isOldFormat && item.reason && (
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                          {item.reason}
                        </p>
                      )}

                      {/* Suggestion (diagnosis mode only) */}
                      {mode === 'diagnosis' && item.suggestion && (
                        <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                          <p className="text-xs font-semibold text-blue-700 mb-0.5">改进建议</p>
                          <p className="text-xs text-blue-600 leading-relaxed">
                            {item.suggestion}
                          </p>
                        </div>
                      )}

                      {/* Examples (new format only) */}
                      {!isOldFormat && item.example && (
                        <div className="mt-2 space-y-1">
                          {item.example
                            .split('\n')
                            .filter(Boolean)
                            .map((line, ei) => (
                              <p
                                key={ei}
                                className="text-xs text-slate-400 leading-relaxed pl-2 border-l-2 border-slate-100"
                              >
                                {line}
                              </p>
                            ))}
                        </div>
                      )}

                      {/* Knowledge point reference (new format) */}
                      {!isOldFormat && item.knowledgePoint && (
                        <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                          <p className="text-xs font-semibold text-blue-600 mb-0.5">
                            📖 Session {item.knowledgePoint.session} ·{' '}
                            {item.knowledgePoint.topic}
                          </p>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {item.knowledgePoint.concept}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            [{item.knowledgePoint.pdfFile}, p.
                            {item.knowledgePoint.pdfPage}]
                          </p>
                        </div>
                      )}

                      {/* Knowledge point reference (old format) */}
                      {isOldFormat &&
                        item.knowledgePoints &&
                        item.knowledgePoints.map((ref, ri) => (
                          <div
                            key={ri}
                            className="mt-2 text-xs text-slate-400"
                          >
                            📖 Session {ref.session} · {ref.topic} [
                            {ref.pdfFile}, p.{ref.pdfPage}]
                          </div>
                        ))}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
