'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../../../components/layout/ProtectedRoute';
import api from '../../../../lib/axios';
import { useAuthStore } from '../../../../store/authStore';

export default function AddContestPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    type: 'NORMAL',
    platform: 'CODEFORCES',
    startTime: '',
    endTime: '',
    link: '',
    description: '',
  });

  const [availableProblems, setAvailableProblems] = useState<any[]>([]);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(false);

  // Redirect non-admins
  if (user && user.role !== 'ADMIN') {
    router.replace('/club');
    return null;
  }

  // Fetch problems when REVERSE_CODING is selected
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (formData.type === 'REVERSE_CODING') {
      setLoadingProblems(true);
      // Fetch problems specifically for reverse coding (CUSTOM platform, has reference solution)
      api
        .get('/api/problems?platform=CUSTOM&limit=100')
        .then((res) => setAvailableProblems(res.data.problems || []))
        .catch(console.error)
        .finally(() => setLoadingProblems(false));
    }
  }, [formData.type]);

  const toggleProblem = (id: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        problemIds: formData.type === 'REVERSE_CODING' ? selectedProblemIds : undefined,
      };

      await api.post('/api/contests', payload);
      alert('Contest added successfully!');
      router.push('/contests');
    } catch (err) {
      console.error('Add contest failed', err);
      alert('Failed to add contest. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">ADD CONTEST</h1>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-8 bg-bg-surface border border-border-default rounded-lg p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Contest Name *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Contest Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value,
                      platform: e.target.value === 'REVERSE_CODING' ? 'CUSTOM' : formData.platform,
                    })
                  }
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="REVERSE_CODING">Reverse Coding</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                Platform *
              </label>
              <select
                required
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                disabled={formData.type === 'REVERSE_CODING'}
                className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="CODEFORCES">Codeforces</option>
                <option value="ATCODER">AtCoder</option>
                <option value="LEETCODE">LeetCode</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Start Time (Local) *
                </label>
                <input
                  required
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  End Time (Local) *
                </label>
                <input
                  required
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                Link *
              </label>
              <input
                required
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-bg-elevated border border-border-default rounded px-3 py-2 text-sm font-sans text-text-primary focus:outline-none focus:border-accent custom-scrollbar"
                placeholder="Optional description..."
              />
            </div>

            {/* Reverse Coding Problem Selection */}
            {formData.type === 'REVERSE_CODING' && (
              <div className="flex flex-col gap-4 border-t border-border-subtle pt-6">
                <h3 className="text-sm font-bold tracking-widest text-text-primary uppercase font-mono">
                  Select Reverse Coding Problems
                </h3>
                <p className="text-xs text-text-muted">
                  Select the CUSTOM problems that will be part of this reverse coding contest.
                  Ensure these problems have a reference solution set in the admin panel.
                </p>

                {loadingProblems ? (
                  <div className="text-sm text-text-muted italic">Loading problems...</div>
                ) : availableProblems.length === 0 ? (
                  <div className="text-sm text-text-muted italic bg-bg-elevated p-4 rounded border border-border-default">
                    No custom problems available. Create some in the admin panel first.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar border border-border-default rounded-md bg-bg-elevated p-2">
                    {availableProblems.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 p-2 hover:bg-bg-surface rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProblemIds.includes(p.id)}
                          onChange={() => toggleProblem(p.id)}
                          className="w-4 h-4 accent-accent"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-text-primary font-medium">{p.title}</span>
                          <span className="text-[10px] font-mono text-text-muted">
                            {p.difficulty}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <div className="text-xs text-text-muted font-mono">
                  Selected: {selectedProblemIds.length} problem(s)
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-border-subtle">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-8 rounded bg-accent text-bg-primary text-xs font-mono font-bold tracking-wider hover:bg-[#fbbf24] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'SAVING...' : 'SAVE CONTEST'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
