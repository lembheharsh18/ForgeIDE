'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import api from '../../lib/axios';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  resolved: boolean;
  tags: string[];
  createdAt: string;
  replyCount: number;
  user: {
    username: string;
    avatarUrl: string | null;
  };
}

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await api.get('/api/forum');
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Failed to fetch forum posts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await api.post('/api/forum', {
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: [],
      });
      setNewTitle('');
      setNewContent('');
      setIsCreating(false);
      fetchPosts();
    } catch (err) {
      console.error('Failed to create post', err);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-syne tracking-wider text-text-primary">
            Doubt Forum
          </h1>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 rounded text-xs font-bold font-mono tracking-wider transition-colors"
            style={{
              backgroundColor: isCreating ? 'var(--bg-elevated)' : 'var(--accent)',
              color: isCreating ? 'var(--text-primary)' : '#0a0a0a',
              border: '1px solid',
              borderColor: isCreating ? 'var(--border-default)' : 'var(--accent)',
            }}
          >
            {isCreating ? 'CANCEL' : '+ ASK A QUESTION'}
          </button>
        </div>

        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-6 rounded-lg bg-bg-surface border border-border-subtle"
            onSubmit={handleCreatePost}
          >
            <div className="mb-4">
              <label className="block text-xs font-mono text-text-muted mb-2">Title</label>
              <input
                required
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What is your doubt?"
                className="w-full p-3 rounded bg-bg-elevated border border-border-default focus:border-accent outline-none font-mono text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-mono text-text-muted mb-2">Description</label>
              <textarea
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Provide details, code snippets, or error messages..."
                className="w-full p-3 rounded bg-bg-elevated border border-border-default focus:border-accent outline-none font-mono text-sm min-h-[150px] resize-y"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 rounded text-xs font-bold font-mono tracking-wider bg-accent text-[#0a0a0a] hover:bg-[#2ae075] transition-colors"
              >
                POST QUESTION
              </button>
            </div>
          </motion.form>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10 font-mono text-text-muted">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 font-mono text-text-muted bg-bg-surface border border-border-subtle rounded-lg">
              No questions asked yet. Be the first!
            </div>
          ) : (
            posts.map((post) => (
              <Link key={post.id} href={`/forum/${post.id}`}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="p-5 rounded-lg bg-bg-surface border border-border-subtle hover:border-accent transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold font-syne text-text-primary group-hover:text-accent transition-colors">
                      {post.title}
                    </h3>
                    {post.resolved && (
                      <span className="px-2 py-1 rounded text-[10px] font-bold font-mono bg-green-500/10 text-green-500 border border-green-500/20">
                        RESOLVED
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-mono text-text-secondary line-clamp-2 mb-4">
                    {post.content}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-bg-elevated border border-border-default flex items-center justify-center font-bold text-[10px]">
                        {post.user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{post.user.username}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>
                      {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
