'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Checklist from '@/components/Checklist';

interface Submission {
  id: string;
  idea_id: string;
  visitor_id: string;
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
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

interface LogEntry {
  id: number;
  visitor_id: string | null;
  method: string;
  path: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'submissions' | 'logs'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  // Try to auth on mount
  useEffect(() => {
    fetch('/api/admin', { method: 'GET' })
      .then(async (r) => {
        if (r.ok) {
          setAuthenticated(true);
          setShowLogin(false);
          loadData('submissions');
        } else {
          setShowLogin(true);
          setLoading(false);
        }
      })
      .catch(() => {
        setShowLogin(true);
        setLoading(false);
      });
  }, []);

  const loadData = (t: 'submissions' | 'logs') => {
    setLoading(true);
    if (t === 'submissions') {
      fetch('/api/admin/data?type=submissions')
        .then((r) => r.json())
        .then((d) => {
          setSubmissions(d.submissions || []);
          setLogs([]);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      fetch('/api/admin/data?type=logs')
        .then((r) => r.json())
        .then((d) => {
          setLogs(d.logs || []);
          setSubmissions([]);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        setAuthenticated(true);
        setShowLogin(false);
        loadData('submissions');
      } else {
        setLoginError('密码错误');
      }
    } catch {
      setLoginError('请求失败');
    } finally {
      setLoginLoading(false);
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">
              管理员登录
            </h1>
            <form onSubmit={handleLogin}>
              <label htmlFor="pw" className="block text-sm font-semibold text-slate-700 mb-2">
                管理密码
              </label>
              <input
                id="pw"
                type="password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入管理密码"
              />
              {loginError && <p className="mt-3 text-sm text-red-600">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading || !password}
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loginLoading ? '登录中...' : '登录'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">管理后台</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setTab('submissions'); loadData('submissions'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'submissions' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              提交记录
            </button>
            <button
              onClick={() => { setTab('logs'); loadData('logs'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'logs' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              访问日志
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'submissions' ? (
          submissions.length === 0 ? (
            <p className="text-center text-slate-400 py-20">暂无提交记录</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className={`bg-white rounded-xl border overflow-hidden ${
                    s.pinned ? 'ring-2 ring-amber-300' : 'border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    className="w-full text-left p-5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700">
                          {s.idea}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-400">
                          <span>v{s.version} ({s.branch})</span>
                          <span>{s.created_at.replace('T', ' ').slice(0, 19)}</span>
                          <span className="font-mono">visitor: {s.visitor_id.slice(0, 10)}</span>
                          {s.ip && <span className="font-mono">IP: {s.ip}</span>}
                          <span className={s.mode === 'mock' ? 'text-amber-600' : 'text-green-600'}>
                            {s.mode}
                          </span>
                          <span>{s.checklist?.length || 0} 条</span>
                        </div>
                      </div>
                      <span className="text-slate-400 flex-shrink-0">
                        {expanded === s.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {expanded === s.id && (
                    <div className="border-t border-slate-100 p-5 space-y-4">
                      {s.user_agent && (
                        <p className="text-xs text-slate-400 break-all font-mono">
                          UA: {s.user_agent}
                        </p>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">想法</p>
                        <p className="text-sm text-slate-700">{s.idea}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">澄清问题与回答</p>
                        <div className="space-y-2">
                          {s.questions.map((q, i) => (
                            <div key={i} className="text-sm">
                              <p className="text-slate-600 font-medium">Q{i + 1}: {q}</p>
                              <p className="text-slate-400 ml-4">{s.answers?.[i] || '—'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {s.checklist && s.checklist.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-2">Checklist</p>
                          <Checklist items={s.checklist} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : logs.length === 0 ? (
          <p className="text-center text-slate-400 py-20">暂无访问日志</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">时间</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">方法</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">路径</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Visitor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{log.created_at.replace('T', ' ').slice(0, 19)}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${log.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">{log.path}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs font-mono">{log.visitor_id?.slice(0, 10) || '—'}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs font-mono">{log.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
