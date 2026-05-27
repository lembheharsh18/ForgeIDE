'use client';

// ── Admin Add Contest ────────────────────────────

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ProtectedRoute } from '../../../../components/layout/ProtectedRoute';
import api from '../../../../lib/axios';
import { useAuthStore } from '../../../../store/authStore';

export default function AddContestPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    platform: 'CODEFORCES',
    startTime: '',
    endTime: '',
    link: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect non-admins
  if (user && user.role !== 'ADMIN') {
    router.replace('/club/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      };

      await api.post('/api/contests', payload);
      alert('Contest added successfully!');
      router.push('/club/contests');
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
