'use client';

// ── Problems Page ────────────────────────────────

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

import { ProtectedRoute } from '../../../components/layout/ProtectedRoute';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { DataTable } from '../../../components/ui/DataTable';
import { Pagination } from '../../../components/ui/Pagination';
import api from '../../../lib/axios';

interface Problem {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  tags: string[];
  link?: string;
  solvedCount: number;
  isSolved: boolean;
}

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
];

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('ALL');
  const [difficulty, setDifficulty] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [tags, setTags] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState('createdAt');

  const fetchProblems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        sort: sortKey,
      });

      if (search) params.append('search', search);
      if (platform !== 'ALL') params.append('platform', platform);
      if (difficulty !== 'ALL') params.append('difficulty', difficulty);
      if (status !== 'ALL') params.append('status', status.toLowerCase());
      if (tags.length > 0) params.append('tags', tags.join(','));

      const res = await api.get(`/api/problems?${params.toString()}`);
      setProblems(res.data.problems);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch problems', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, platform, difficulty, status, tags, sortKey]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleClearFilters = () => {
    setSearch('');
    setPlatform('ALL');
    setDifficulty('ALL');
    setStatus('ALL');
    setTags([]);
    setPage(1);
  };

  const columns = [
    {
      key: 'status',
      header: 'Status',
      render: (p: Problem) => (
        <span className={p.isSolved ? 'text-[#39ff8a] font-bold text-lg' : 'text-text-muted'}>
          {p.isSolved ? '✓' : '-'}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (p: Problem) => (
        <Link
          href={`/ide?problem=${p.id}`}
          className="font-bold text-text-primary hover:text-accent transition-colors"
        >
          {p.title}
        </Link>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (p: Problem) => (
        <Badge variant={`platform-${p.platform}` as BadgeVariant} label={p.platform} />
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      sortable: true,
      render: (p: Problem) => (
        <Badge
          variant={`difficulty-${p.difficulty.toUpperCase()}` as BadgeVariant}
          label={p.difficulty}
        />
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (p: Problem) => (
        <div className="flex flex-wrap gap-1">
          {p.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant={`tag-${t}` as BadgeVariant} label={t} />
          ))}
          {p.tags.length > 3 && (
            <span
              className="text-[10px] text-text-muted font-mono bg-bg-elevated px-1.5 py-0.5 rounded-full"
              title={p.tags.slice(3).join(', ')}
            >
              +{p.tags.length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'solvedCount',
      header: 'Solved By',
      sortable: true,
      render: (p: Problem) => (
        <span className="text-text-muted text-xs font-mono">{p.solvedCount} users</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p: Problem) => (
        <div className="flex items-center gap-3">
          <Link
            href={`/ide?problem=${p.id}`}
            className="text-[10px] font-mono font-bold tracking-wider text-bg-primary bg-accent px-3 py-1 rounded hover:bg-[#fbbf24] transition-colors"
          >
            ▶ SOLVE
          </Link>
          {p.link && (
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono tracking-wider text-blue hover:underline flex items-center gap-1"
            >
              ↗ CF
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">PROBLEMS</h1>

          <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
            {/* Left Sidebar: Filters */}
            <div className="w-full lg:w-[260px] shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
              {/* Search */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Problem title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-bg-surface border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Status
                </label>
                <div className="flex flex-col gap-1.5">
                  {['ALL', 'Solved', 'Unsolved'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={status === opt}
                        onChange={() => setStatus(opt)}
                        className="accent-accent"
                      />
                      <span className="text-sm text-text-primary">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Platform
                </label>
                <div className="flex flex-col gap-1.5">
                  {['ALL', 'CODEFORCES', 'ATCODER', 'LEETCODE', 'CUSTOM'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="platform"
                        checked={platform === opt}
                        onChange={() => setPlatform(opt)}
                        className="accent-accent"
                      />
                      <span className="text-sm text-text-primary">
                        {opt === 'ALL' ? 'All Platforms' : opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">
                  Tags
                </label>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {TAGS_LIST.map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tags.includes(t)}
                        onChange={(e) => {
                          if (e.target.checked) setTags([...tags, t]);
                          else setTags(tags.filter((x) => x !== t));
                        }}
                        className="accent-accent rounded-sm"
                      />
                      <span className="text-sm text-text-primary">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear */}
              <button
                onClick={handleClearFilters}
                className="mt-4 border border-border-default rounded py-2 text-xs font-mono font-bold tracking-wider text-text-muted hover:bg-bg-surface hover:text-text-primary transition-colors"
              >
                CLEAR FILTERS
              </button>
            </div>

            {/* Main Table Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-bg-primary">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 overflow-hidden flex flex-col"
              >
                <DataTable
                  data={problems}
                  columns={columns}
                  isLoading={isLoading}
                  sortKey={sortKey}
                  onSort={(key) =>
                    setSortKey(key === sortKey && key !== 'createdAt' ? 'createdAt' : key)
                  }
                />
              </motion.div>

              {/* Pagination Row */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-text-muted font-mono">
                  Showing page {page} of {totalPages}
                </span>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
