'use client';

import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import api from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

interface ForumReply {
  id: string;
  content: string;
  isAnswer: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  resolved: boolean;
  tags: string[];
  createdAt: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  replies: ForumReply[];
}

export default function ForumPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/api/forum/${params?.id}`);
      setPost(res.data);
    } catch (err) {
      console.error('Failed to fetch post', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/forum/${params?.id}/reply`, {
        content: newReply.trim(),
      });
      setNewReply('');
      fetchPost();
    } catch (err) {
      console.error('Failed to add reply', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveToggle = async () => {
    try {
      await api.patch(`/api/forum/${params?.id}/resolve`);
      fetchPost();
    } catch (err) {
      console.error('Failed to toggle resolve', err);
    }
  };

  const handleAcceptAnswer = async (replyId: string) => {
    try {
      await api.patch(`/api/forum/replies/${replyId}/answer`);
      fetchPost();
    } catch (err) {
      console.error('Failed to accept answer', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-text-muted">
        Loading post...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-text-muted">
        Post not found
      </div>
    );
  }

  const isAuthor = user?.id === post.user.id;

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 font-mono text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-2"
        >
          ← Back to Forum
        </button>

        {/* Original Post */}
        <div className="p-8 rounded-lg bg-bg-surface border border-border-subtle mb-8 relative">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold font-syne text-text-primary pr-20">{post.title}</h1>
            <div className="flex items-center gap-2">
              {post.resolved && (
                <span className="px-2 py-1 rounded text-[10px] font-bold font-mono bg-green-500/10 text-green-500 border border-green-500/20">
                  RESOLVED
                </span>
              )}
              {isAuthor && (
                <button
                  onClick={handleResolveToggle}
                  className="px-3 py-1 rounded text-[10px] font-bold font-mono border border-border-default hover:bg-bg-hover transition-colors"
                >
                  {post.resolved ? 'MARK UNRESOLVED' : 'MARK RESOLVED'}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-text-muted mb-8 pb-6 border-b border-border-subtle">
            <div className="w-6 h-6 rounded bg-bg-elevated border border-border-default flex items-center justify-center font-bold">
              {post.user.username.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-bold text-text-secondary">{post.user.username}</span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleString()}</span>
          </div>

          <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-text-primary">
            {post.content}
          </div>
        </div>

        <h2 className="text-lg font-bold font-syne mb-6">
          {post.replies.length} {post.replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {/* Replies List */}
        <div className="space-y-4 mb-10">
          {post.replies.map((reply) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-lg bg-bg-surface border transition-colors"
              style={{
                borderColor: reply.isAnswer ? 'var(--green)' : 'var(--border-subtle)',
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                  <div className="w-6 h-6 rounded bg-bg-elevated border border-border-default flex items-center justify-center font-bold">
                    {reply.user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold text-text-secondary">{reply.user.username}</span>
                  <span>•</span>
                  <span>{new Date(reply.createdAt).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  {reply.isAnswer && (
                    <span className="text-xs font-bold font-mono text-green-500 flex items-center gap-1">
                      ✓ ACCEPTED ANSWER
                    </span>
                  )}
                  {isAuthor && !reply.isAnswer && (
                    <button
                      onClick={() => handleAcceptAnswer(reply.id)}
                      className="px-2 py-1 text-[10px] font-bold font-mono text-text-muted hover:text-green-500 border border-border-default hover:border-green-500 rounded transition-colors"
                    >
                      ACCEPT
                    </button>
                  )}
                  {isAuthor && reply.isAnswer && (
                    <button
                      onClick={() => handleAcceptAnswer(reply.id)}
                      className="px-2 py-1 text-[10px] font-bold font-mono text-text-muted hover:text-red-500 border border-border-default hover:border-red-500 rounded transition-colors"
                    >
                      UNACCEPT
                    </button>
                  )}
                </div>
              </div>

              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-text-primary">
                {reply.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reply Form */}
        <div className="p-6 rounded-lg bg-bg-surface border border-border-subtle">
          <h3 className="text-sm font-bold font-syne mb-4">Add a Reply</h3>
          <form onSubmit={handleReply}>
            <textarea
              required
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Write your answer or feedback here..."
              className="w-full p-4 rounded bg-bg-elevated border border-border-default focus:border-accent outline-none font-mono text-sm min-h-[120px] resize-y mb-4"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded text-xs font-bold font-mono tracking-wider bg-accent text-[#0a0a0a] hover:bg-[#2ae075] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'POSTING...' : 'POST REPLY'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
