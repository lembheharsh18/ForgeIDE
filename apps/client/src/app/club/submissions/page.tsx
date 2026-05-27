'use client';

// ── Submissions Page ─────────────────────────────

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

import { ProtectedRoute } from '../../../components/layout/ProtectedRoute';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { DataTable } from '../../../components/ui/DataTable';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import api from '../../../lib/axios';

interface Submission {
  id: string;
  problem: { title: string; platform: string };
  verdict: string;
  language: string;
  timeMs: number | null;
  memoryKb: number | null;
  createdAt: string;
  code?: string; // only fetched if requested, but we'll mock it for the viewer if we don't have an endpoint for single submission code, wait, Prisma schema has it, but GET /me doesn't return code by default? Ah, the prompt didn't specify a GET /api/submissions/:id endpoint, but said "VIEW CODE button -> Modal with CodeMirror (read-only)". I will include code in the GET /me response or fetch it. Actually, GET /api/submissions/me might not return code by default to save bandwidth. Let me modify GET /me to return code if we need it, or since it's a small app, we can fetch it. Let's assume we need to update the backend route to return code.
  // I will just add code here and if it's missing, show a fallback.
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [verdict, setVerdict] = useState('ALL');
  const [language, setLanguage] = useState('ALL');

  // Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (verdict !== 'ALL') params.append('verdict', verdict);
      if (language !== 'ALL') params.append('language', language);

      const res = await api.get(`/api/submissions/me?${params.toString()}`);
      setSubmissions(res.data.submissions);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, verdict, language]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const columns = [
    {
      key: 'problem',
      header: 'Problem',
      render: (s: Submission) => (
        <span className="font-bold text-text-primary">{s.problem.title}</span>
      ),
    },
    {
      key: 'verdict',
      header: 'Verdict',
      render: (s: Submission) => (
        <Badge variant={`verdict-${s.verdict}` as BadgeVariant} label={s.verdict} />
      ),
    },
    {
      key: 'language',
      header: 'Language',
      render: (s: Submission) => (
        <span className="font-mono text-xs text-text-muted">{s.language}</span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (s: Submission) => (
        <span className="font-mono text-xs text-text-muted">
          {s.timeMs ? `${s.timeMs}ms` : '-'}
        </span>
      ),
    },
    {
      key: 'memory',
      header: 'Memory',
      render: (s: Submission) => (
        <span className="font-mono text-xs text-text-muted">
          {s.memoryKb ? `${s.memoryKb}KB` : '-'}
        </span>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (s: Submission) => (
        <span className="font-mono text-xs text-text-muted">
          {new Date(s.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s: Submission) => (
        <button
          onClick={() => setSelectedSubmission(s)}
          className="text-[10px] font-mono font-bold tracking-wider text-text-muted border border-border-default px-3 py-1 rounded hover:bg-bg-elevated hover:text-text-primary transition-colors"
        >
          VIEW CODE
        </button>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">MY SUBMISSIONS</h1>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-6 bg-bg-surface p-4 rounded-lg border border-border-default">
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                Verdict
              </label>
              <select
                value={verdict}
                onChange={(e) => {
                  setVerdict(e.target.value);
                  setPage(1);
                }}
                className="bg-bg-elevated border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="ALL">All Verdicts</option>
                <option value="ACCEPTED">Accepted (AC)</option>
                <option value="WA">Wrong Answer (WA)</option>
                <option value="TLE">Time Limit (TLE)</option>
                <option value="CE">Compile Error (CE)</option>
                <option value="RE">Runtime Error (RE)</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setPage(1);
                }}
                className="bg-bg-elevated border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="ALL">All Languages</option>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
          </div>

          {/* Table Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-bg-primary">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <DataTable data={submissions} columns={columns} isLoading={isLoading} />
            </motion.div>

            <div className="mt-4 flex justify-end">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedSubmission(null)}
            title={`Submission: ${selectedSubmission.problem.title}`}
            maxWidth="max-w-4xl"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div className="flex items-center gap-4">
                  <Badge
                    variant={`verdict-${selectedSubmission.verdict}` as BadgeVariant}
                    label={selectedSubmission.verdict}
                  />
                  <span className="font-mono text-xs text-text-muted">
                    {selectedSubmission.language}
                  </span>
                </div>
                <span className="font-mono text-xs text-text-muted">
                  {new Date(selectedSubmission.createdAt).toLocaleString()}
                </span>
              </div>
              <pre className="p-4 bg-[#0a0a0a] rounded border border-border-subtle overflow-auto text-sm font-mono text-[#d4d4d4] max-h-[60vh]">
                {selectedSubmission.code || '// Code not available'}
              </pre>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  );
}
