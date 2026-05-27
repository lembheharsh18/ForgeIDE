'use client';

// ── Admin Edit Problem ───────────────────────────

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../../../../components/layout/ProtectedRoute';
import api from '../../../../../lib/axios';
import { useAuthStore } from '../../../../../store/authStore';

export default function EditProblemPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.id as string;
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    platform: 'CODEFORCES',
    difficulty: '',
    tags: [] as string[],
    link: '',
    timeLimit: '',
    memoryLimit: '',
    statement: '',
    testCases: [{ input: '', output: '' }],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect non-admins
  if (user && user.role !== 'ADMIN') {
    router.replace('/club/dashboard');
    return null;
  }

  const allTags = [
    'dp',
    'graphs',
    'greedy',
    'trees',
    'binary search',
    'strings',
    'math',
    'geometry',
    'implementation',
    'brute force',
    'number theory',
  ];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.get(`/api/problems/${problemId}`);
        const p = res.data;
        setFormData({
          title: p.title || '',
          platform: p.platform || 'CODEFORCES',
          difficulty: p.difficulty || '',
          tags: p.tags || [],
          link: p.link || '',
          timeLimit: p.timeLimit?.toString() || '',
          memoryLimit: p.memoryLimit?.toString() || '',
          statement: p.statement || '',
          testCases:
            p.testCases && p.testCases.length > 0 ? p.testCases : [{ input: '', output: '' }],
        });
      } catch (err) {
        console.error('Failed to fetch problem', err);
        alert('Failed to load problem data.');
        router.push('/club/problems');
      } finally {
        setIsLoading(false);
      }
    };
    if (problemId) fetchProblem();
  }, [problemId, router]);

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
        memoryLimit: formData.memoryLimit ? parseInt(formData.memoryLimit) : undefined,
        testCases: formData.testCases.filter((tc) => tc.input.trim() || tc.output.trim()),
      };

      await api.put(`/api/problems/${problemId}`, payload);
      alert('Problem updated successfully!');
      router.push('/club/problems');
    } catch (err) {
      console.error('Update problem failed', err);
      alert('Failed to update problem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <span className="text-text-muted italic">Loading problem...</span>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">EDIT PROBLEM</h1>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-8 bg-bg-surface border border-border-default rounded-lg p-8"
          >
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Title *
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Platform *
                </label>
                <select
                  required
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="CODEFORCES">Codeforces</option>
                  <option value="ATCODER">AtCoder</option>
                  <option value="LEETCODE">LeetCode</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Difficulty *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 1500 or Easy"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Link
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <label
                    key={tag}
                    className={`px-3 py-1 rounded-full text-xs font-mono cursor-pointer border transition-colors ${formData.tags.includes(tag) ? 'bg-accent/10 border-accent text-accent' : 'bg-bg-elevated border-border-default text-text-muted hover:border-text-muted'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Time Limit (ms)
                </label>
                <input
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Memory Limit (MB)
                </label>
                <input
                  type="number"
                  value={formData.memoryLimit}
                  onChange={(e) => setFormData({ ...formData, memoryLimit: e.target.value })}
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                Statement (HTML)
              </label>
              <textarea
                rows={10}
                value={formData.statement}
                onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-accent custom-scrollbar"
              />
            </div>

            {/* Test Cases */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Test Cases
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      testCases: [...prev.testCases, { input: '', output: '' }],
                    }))
                  }
                  className="text-[10px] font-mono font-bold tracking-wider text-text-primary border border-border-default px-3 py-1 rounded hover:bg-bg-elevated transition-colors"
                >
                  + ADD TEST CASE
                </button>
              </div>
              {formData.testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-4 border border-border-subtle rounded bg-bg-elevated"
                >
                  <div className="flex flex-col gap-2 flex-1">
                    <span className="text-[10px] font-mono text-text-muted">Input #{idx + 1}</span>
                    <textarea
                      rows={3}
                      value={tc.input}
                      onChange={(e) => {
                        const newTc = [...formData.testCases];
                        newTc[idx].input = e.target.value;
                        setFormData({ ...formData, testCases: newTc });
                      }}
                      className="bg-bg-primary border border-border-default rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent custom-scrollbar"
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <span className="text-[10px] font-mono text-text-muted">Output #{idx + 1}</span>
                    <textarea
                      rows={3}
                      value={tc.output}
                      onChange={(e) => {
                        const newTc = [...formData.testCases];
                        newTc[idx].output = e.target.value;
                        setFormData({ ...formData, testCases: newTc });
                      }}
                      className="bg-bg-primary border border-border-default rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent custom-scrollbar"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newTc = [...formData.testCases];
                      newTc.splice(idx, 1);
                      setFormData({ ...formData, testCases: newTc });
                    }}
                    className="mt-6 text-red hover:text-[#ff4545] font-bold px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-border-subtle">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-8 rounded bg-accent text-bg-primary text-xs font-mono font-bold tracking-wider hover:bg-[#fbbf24] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'SAVING...' : 'UPDATE PROBLEM'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
