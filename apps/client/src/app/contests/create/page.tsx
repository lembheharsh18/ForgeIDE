'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import api from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import type { Problem } from '../../../store/editorStore';

export default function CreateContestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    type: 'NORMAL', // NORMAL | REVERSE_CODING
    startTime: '',
    durationMinutes: 120,
    platform: 'CUSTOM',
    link: '',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Problem Picker State
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProblemIds, setSelectedProblemIds] = useState<Set<string>>(new Set());
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      setIsLoadingProblems(true);
      try {
        const res = await api.get('/api/problems');
        setProblems(res.data.problems || []);
      } catch {
        // ignore
      } finally {
        setIsLoadingProblems(false);
      }
    };
    fetchProblems();
  }, []);

  const filteredProblems = problems.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  const toggleProblem = (id: string) => {
    const next = new Set(selectedProblemIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProblemIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const start = new Date(formData.startTime);
      const end = new Date(start.getTime() + formData.durationMinutes * 60000);

      await api.post('/api/contests', {
        name: formData.title,
        type: formData.type,
        platform: formData.platform,
        link: formData.link || undefined,
        description: formData.description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        problemIds: Array.from(selectedProblemIds),
      });
      router.push('/contests');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create contest');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left: Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 p-8 rounded-lg flex flex-col"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h1 className="text-2xl font-bold mb-6 font-syne">Create Contest</h1>

          {error && (
            <div className="mb-6 p-3 rounded text-sm bg-red-500/10 text-red-500 font-mono border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono flex-1 flex flex-col">
            <div>
              <label className="block text-xs text-text-muted mb-1">Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 rounded text-sm bg-bg-elevated border border-border-default focus:border-accent outline-none transition-colors"
                placeholder="e.g. Weekly Codeforces Contest"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Start Time</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full p-2.5 rounded text-sm bg-bg-elevated border border-border-default focus:border-accent outline-none transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Duration (minutes)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded text-sm bg-bg-elevated border border-border-default focus:border-accent outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Contest Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2.5 rounded text-sm bg-bg-elevated border border-border-default focus:border-accent outline-none transition-colors"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="REVERSE_CODING">Reverse Coding</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full p-2.5 rounded text-sm bg-bg-elevated border border-border-default focus:border-accent outline-none transition-colors"
                >
                  <option value="CUSTOM">In-Platform (Custom)</option>
                  <option value="CODEFORCES">Codeforces</option>
                  <option value="CODECHEF">CodeChef</option>
                  <option value="LEETCODE">LeetCode</option>
                  <option value="ATCODER">AtCoder</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">External Link (Optional)</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full p-2.5 rounded text-sm bg-bg-elevated border border-border-default focus:border-accent outline-none transition-colors"
                placeholder="https://... (Leave blank for in-platform)"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-[120px]">
              <label className="block text-xs text-text-muted mb-1">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full flex-1 p-2.5 rounded text-sm bg-bg-elevated border border-border-default focus:border-accent outline-none transition-colors resize-none"
                placeholder="Additional details..."
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 rounded text-sm border border-border-default hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded text-sm font-bold bg-accent text-[#0a0a0a] hover:bg-[#2ae075] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Contest'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right: Problem Picker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full md:w-[350px] p-6 rounded-lg flex flex-col h-[600px] md:h-auto"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-syne">Problems</h2>
            <span className="text-xs font-mono text-text-muted">
              {selectedProblemIds.size} selected
            </span>
          </div>

          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 mb-4 rounded text-xs bg-bg-elevated border border-border-default focus:border-accent outline-none transition-colors font-mono"
          />

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {isLoadingProblems ? (
              <div className="text-center text-text-muted text-sm font-mono mt-4">Loading...</div>
            ) : filteredProblems.length === 0 ? (
              <div className="text-center text-text-muted text-sm font-mono mt-4">
                No problems found
              </div>
            ) : (
              filteredProblems.map((p) => {
                const isSelected = selectedProblemIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProblem(p.id)}
                    className="w-full text-left p-3 rounded border transition-all duration-150 flex items-start gap-3 group"
                    style={{
                      backgroundColor: isSelected
                        ? 'rgba(57, 255, 138, 0.05)'
                        : 'var(--bg-elevated)',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border-default)',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                      style={{
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <span className="text-[#0a0a0a] text-[10px] font-bold">✓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-text-primary truncate">{p.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] font-mono text-text-muted">{p.difficulty}</span>
                        {p.platform && (
                          <span className="text-[9px] font-mono text-text-muted border-l border-border-subtle pl-2">
                            {p.platform}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
