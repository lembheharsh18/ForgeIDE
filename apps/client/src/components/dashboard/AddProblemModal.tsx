'use client';

// ── Add / Edit Problem Modal ─────────────────────

import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import api from '../../lib/axios';
import { Modal } from '../ui/Modal';

// ── Types ────────────────────────────────────────

interface TestCase {
  input: string;
  output: string;
}

interface ProblemFormData {
  title: string;
  platform: string;
  difficulty: string;
  tags: string[];
  link: string;
  cfContestId: string;
  cfIndex: string;
  timeLimit: string;
  memoryLimit: string;
  statement: string;
  inputSpec: string;
  outputSpec: string;
  noteSection: string;
  testCases: TestCase[];
}

export interface EditableProblem {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  tags: string[];
  link?: string | null;
  cfContestId?: string | null;
  cfIndex?: string | null;
  timeLimit?: number | null;
  memoryLimit?: number | null;
  statement?: string | null;
  inputSpec?: string | null;
  outputSpec?: string | null;
  noteSection?: string | null;
  testCases?: TestCase[] | null;
}

interface AddProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editProblem?: EditableProblem | null;
}

// ── Constants ────────────────────────────────────

const TAGS_LIST = [
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
  'sorting',
  'two pointers',
  'dfs',
  'bfs',
  'bit manipulation',
];

const EMPTY_FORM: ProblemFormData = {
  title: '',
  platform: 'CUSTOM',
  difficulty: 'Easy',
  tags: [],
  link: '',
  cfContestId: '',
  cfIndex: '',
  timeLimit: '',
  memoryLimit: '',
  statement: '',
  inputSpec: '',
  outputSpec: '',
  noteSection: '',
  testCases: [{ input: '', output: '' }],
};

// ── Component ────────────────────────────────────

export function AddProblemModal({ isOpen, onClose, onSuccess, editProblem }: AddProblemModalProps) {
  const isEditMode = !!editProblem;
  const [mode, setMode] = useState<'cf' | 'custom'>('cf');
  const [form, setForm] = useState<ProblemFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CF Import specific
  const [cfImporting, setCfImporting] = useState(false);
  const [cfImported, setCfImported] = useState(false);

  // Reset form when modal opens/closes or editProblem changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCfImported(false);
      setCfImporting(false);

      if (editProblem) {
        setMode('custom');
        setForm({
          title: editProblem.title || '',
          platform: editProblem.platform || 'CUSTOM',
          difficulty: editProblem.difficulty || 'Easy',
          tags: editProblem.tags || [],
          link: editProblem.link || '',
          cfContestId: editProblem.cfContestId || '',
          cfIndex: editProblem.cfIndex || '',
          timeLimit: editProblem.timeLimit ? String(editProblem.timeLimit) : '',
          memoryLimit: editProblem.memoryLimit ? String(editProblem.memoryLimit) : '',
          statement: editProblem.statement || '',
          inputSpec: editProblem.inputSpec || '',
          outputSpec: editProblem.outputSpec || '',
          noteSection: editProblem.noteSection || '',
          testCases:
            editProblem.testCases && editProblem.testCases.length > 0
              ? editProblem.testCases
              : [{ input: '', output: '' }],
        });
      } else {
        setMode('cf');
        setForm(EMPTY_FORM);
      }
    }
  }, [isOpen, editProblem]);

  // ── Field Helpers ──────────────────────────────

  const updateField = useCallback(
    <K extends keyof ProblemFormData>(field: K, value: ProblemFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const toggleTag = useCallback((tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  }, []);

  // ── Test Case Helpers ──────────────────────────

  const addTestCase = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', output: '' }],
    }));
  }, []);

  const removeTestCase = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  }, []);

  const updateTestCase = useCallback((index: number, field: 'input' | 'output', value: string) => {
    setForm((prev) => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc)),
    }));
  }, []);

  // ── CF Import ──────────────────────────────────

  const handleCfImport = async () => {
    if (!form.cfContestId.trim() || !form.cfIndex.trim()) {
      setError('Both Contest ID and Problem Index are required');
      return;
    }

    setCfImporting(true);
    setError(null);

    try {
      // Create a temporary problem to trigger the CF scraper, then we'll use that data
      const res = await api.post('/api/problems', {
        title: `CF-${form.cfContestId}${form.cfIndex}`,
        platform: 'CODEFORCES',
        difficulty: form.difficulty || 'Medium',
        tags: form.tags.length > 0 ? form.tags : ['competitive'],
        cfContestId: form.cfContestId.trim(),
        cfIndex: form.cfIndex.trim().toUpperCase(),
        link: `https://codeforces.com/contest/${form.cfContestId.trim()}/problem/${form.cfIndex.trim().toUpperCase()}`,
      });

      toast.success(`Imported "${res.data.title}" from Codeforces!`);
      setCfImported(true);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Failed to import from Codeforces';
      setError(msg);
    } finally {
      setCfImporting(false);
    }
  };

  // ── Submit (Custom / Edit) ─────────────────────

  const handleSubmit = async () => {
    // Validation
    if (!form.title.trim()) {
      setError('Problem title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      platform: form.platform,
      difficulty: form.difficulty,
      tags: form.tags,
      link: form.link.trim() || undefined,
      cfContestId: form.cfContestId.trim() || undefined,
      cfIndex: form.cfIndex.trim().toUpperCase() || undefined,
      timeLimit: form.timeLimit ? parseInt(form.timeLimit, 10) : undefined,
      memoryLimit: form.memoryLimit ? parseInt(form.memoryLimit, 10) : undefined,
      statement: form.statement.trim() || undefined,
      inputSpec: form.inputSpec.trim() || undefined,
      outputSpec: form.outputSpec.trim() || undefined,
      noteSection: form.noteSection.trim() || undefined,
      testCases:
        form.testCases.filter((tc) => tc.input.trim() || tc.output.trim()).length > 0
          ? form.testCases.filter((tc) => tc.input.trim() || tc.output.trim())
          : undefined,
    };

    try {
      if (isEditMode && editProblem) {
        await api.put(`/api/problems/${editProblem.id}`, payload);
        toast.success('Problem updated successfully!');
      } else {
        await api.post('/api/problems', payload);
        toast.success('Problem created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Failed to save problem';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Shared Styles ──────────────────────────────

  const inputClass =
    'w-full p-2.5 rounded text-sm bg-bg-elevated border border-border-default focus:border-accent outline-none transition-colors font-mono';
  const labelClass =
    'block text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase mb-1.5';
  const sectionClass = 'border-t border-border-subtle pt-4 mt-4';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? '✏️ Edit Problem' : '+ Add Problem'}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* ── Mode Tabs (only in create mode) ── */}
        {!isEditMode && (
          <div className="flex gap-1 p-1 rounded-lg bg-bg-elevated">
            <button
              type="button"
              onClick={() => setMode('cf')}
              className={`flex-1 py-2 px-4 rounded-md text-xs font-mono font-bold tracking-wider transition-all duration-200 ${
                mode === 'cf'
                  ? 'bg-accent text-[#0a0a0a]'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'
              }`}
            >
              ⚡ CF IMPORT
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 px-4 rounded-md text-xs font-mono font-bold tracking-wider transition-all duration-200 ${
                mode === 'custom'
                  ? 'bg-accent text-[#0a0a0a]'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'
              }`}
            >
              📝 CUSTOM PROBLEM
            </button>
          </div>
        )}

        {/* ── Error Banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded text-xs font-mono border bg-[rgba(255,69,69,0.08)] border-[rgba(255,69,69,0.2)] text-[#ff4545]"
            >
              ⚠ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ────────────────────────────────────── */}
        {/* ── CF Import Mode ── */}
        {/* ────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {mode === 'cf' && !isEditMode ? (
            <motion.div
              key="cf-mode"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg border border-dashed border-border-default bg-bg-surface">
                <p className="text-xs text-text-muted font-mono mb-4">
                  Import a problem directly from Codeforces. Enter the contest ID and problem index,
                  and we&apos;ll auto-fetch the title, statement, test cases, and constraints.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Contest ID</label>
                    <input
                      type="text"
                      value={form.cfContestId}
                      onChange={(e) => updateField('cfContestId', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 1900"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Problem Index</label>
                    <input
                      type="text"
                      value={form.cfIndex}
                      onChange={(e) => updateField('cfIndex', e.target.value.toUpperCase())}
                      className={inputClass}
                      placeholder="e.g. C"
                      maxLength={3}
                    />
                  </div>
                </div>

                {/* Quick preview of what will be fetched */}
                {form.cfContestId && form.cfIndex && (
                  <div className="mt-3 p-2 rounded bg-bg-elevated border border-border-subtle">
                    <p className="text-[10px] font-mono text-text-muted">
                      Will import from:{' '}
                      <span className="text-blue">
                        codeforces.com/contest/{form.cfContestId}/problem/{form.cfIndex}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Optional overrides for CF import */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => updateField('difficulty', e.target.value)}
                    className={inputClass}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tags (optional)</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {TAGS_LIST.slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border transition-all duration-150 ${
                          form.tags.includes(tag)
                            ? 'bg-accent text-[#0a0a0a] border-accent'
                            : 'bg-bg-elevated text-text-muted border-border-default hover:border-text-muted'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Import Button */}
              <button
                type="button"
                onClick={handleCfImport}
                disabled={cfImporting || !form.cfContestId.trim() || !form.cfIndex.trim()}
                className="w-full py-3 rounded-lg text-sm font-mono font-bold tracking-wider bg-accent text-[#0a0a0a] hover:bg-[#fbbf24] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cfImporting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                    IMPORTING...
                  </span>
                ) : (
                  '⚡ IMPORT FROM CODEFORCES'
                )}
              </button>
            </motion.div>
          ) : (
            /* ────────────────────────────────────── */
            /* ── Custom / Edit Mode ── */
            /* ────────────────────────────────────── */
            <motion.div
              key="custom-mode"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* ── Basic Info ── */}
              <div>
                <label className={labelClass}>Problem Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Two Sum, Maximum Subarray"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Platform</label>
                  <select
                    value={form.platform}
                    onChange={(e) => updateField('platform', e.target.value)}
                    className={inputClass}
                  >
                    <option value="CUSTOM">Custom</option>
                    <option value="CODEFORCES">Codeforces</option>
                    <option value="ATCODER">AtCoder</option>
                    <option value="LEETCODE">LeetCode</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => updateField('difficulty', e.target.value)}
                    className={inputClass}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Problem Link</label>
                  <input
                    type="url"
                    value={form.link}
                    onChange={(e) => updateField('link', e.target.value)}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* ── Tags ── */}
              <div>
                <label className={labelClass}>Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS_LIST.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider border transition-all duration-150 ${
                        form.tags.includes(tag)
                          ? 'bg-accent text-[#0a0a0a] border-accent'
                          : 'bg-bg-elevated text-text-muted border-border-default hover:border-text-muted'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Constraints ── */}
              <div className={sectionClass}>
                <label className={`${labelClass} mb-3`}>Constraints</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono text-text-muted mb-1">
                      Time Limit (ms)
                    </label>
                    <input
                      type="number"
                      value={form.timeLimit}
                      onChange={(e) => updateField('timeLimit', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 2000"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-text-muted mb-1">
                      Memory Limit (MB)
                    </label>
                    <input
                      type="number"
                      value={form.memoryLimit}
                      onChange={(e) => updateField('memoryLimit', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 256"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* ── Problem Statement ── */}
              <div className={sectionClass}>
                <label className={labelClass}>Problem Statement</label>
                <textarea
                  value={form.statement}
                  onChange={(e) => updateField('statement', e.target.value)}
                  className={`${inputClass} resize-none`}
                  rows={5}
                  placeholder="Describe the problem..."
                />
              </div>

              {/* ── Input / Output Spec ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Input Specification</label>
                  <textarea
                    value={form.inputSpec}
                    onChange={(e) => updateField('inputSpec', e.target.value)}
                    className={`${inputClass} resize-none`}
                    rows={3}
                    placeholder="Input format..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Output Specification</label>
                  <textarea
                    value={form.outputSpec}
                    onChange={(e) => updateField('outputSpec', e.target.value)}
                    className={`${inputClass} resize-none`}
                    rows={3}
                    placeholder="Output format..."
                  />
                </div>
              </div>

              {/* ── Note ── */}
              <div>
                <label className={labelClass}>Note / Explanation</label>
                <textarea
                  value={form.noteSection}
                  onChange={(e) => updateField('noteSection', e.target.value)}
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="Additional notes or explanation..."
                />
              </div>

              {/* ── Test Cases ── */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass + ' mb-0'}>Test Cases</label>
                  <button
                    type="button"
                    onClick={addTestCase}
                    className="text-[10px] font-mono font-bold tracking-wider text-accent hover:text-[#fbbf24] transition-colors"
                  >
                    + ADD TEST CASE
                  </button>
                </div>

                <div className="space-y-3">
                  {form.testCases.map((tc, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative p-3 rounded-lg bg-bg-surface border border-border-subtle group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-text-muted">
                          TEST #{i + 1}
                        </span>
                        {form.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestCase(i)}
                            className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-[#ff4545] hover:text-[#ff6b6b] transition-all"
                          >
                            ✕ REMOVE
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono text-text-muted mb-1">
                            Input
                          </label>
                          <textarea
                            value={tc.input}
                            onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                            className={`${inputClass} resize-none text-xs`}
                            rows={3}
                            placeholder="Test input..."
                            spellCheck={false}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-text-muted mb-1">
                            Expected Output
                          </label>
                          <textarea
                            value={tc.output}
                            onChange={(e) => updateTestCase(i, 'output', e.target.value)}
                            className={`${inputClass} resize-none text-xs`}
                            rows={3}
                            placeholder="Expected output..."
                            spellCheck={false}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── Submit Button ── */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider border border-border-default text-text-muted hover:bg-bg-surface hover:text-text-primary transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !form.title.trim()}
                  className="px-6 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider bg-accent text-[#0a0a0a] hover:bg-[#fbbf24] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                      {isEditMode ? 'UPDATING...' : 'CREATING...'}
                    </span>
                  ) : isEditMode ? (
                    '✓ UPDATE PROBLEM'
                  ) : (
                    '+ CREATE PROBLEM'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
