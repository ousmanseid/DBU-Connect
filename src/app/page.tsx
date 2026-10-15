'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Globe,
  Lock,
  Flag,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface PostItem {
  id: string;
  content: string;
  mediaUrl?: string | null;
  visibility: string;
  shareCount: number;
  createdAt: string;
  author: {
    id: string;
    role: string;
    displayName: string;
    avatarUrl?: string | null;
    department: string;
  };
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export default function HomePage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postVisibility, setPostVisibility] = useState<'CAMPUS' | 'FRIENDS_ONLY'>('CAMPUS');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data?.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      setIsSubmitting(true);
      setFeedbackMessage(null);

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent.trim(),
          visibility: postVisibility,
          mediaUrl: postMediaUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish post');
      }

      setPostContent('');
      setPostMediaUrl('');
      setFeedbackMessage({ type: 'success', text: 'Post published to campus feed!' });
      setPosts((prev) => [data.post, ...prev]);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'You must be logged in to post.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, hasLiked: data.isLiked, likeCount: data.likeCount }
              : p
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }

    setActiveCommentPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        const data = await res.json();
        if (data?.comments) {
          setCommentsMap((prev) => ({ ...prev, [postId]: data.comments }));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentInput.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setCommentInput('');
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/share`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, shareCount: data.shareCount } : p
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Debre Berhan University Social Feed" />

        <div className="app-content">
          {/* Post Composer */}
          <div className="card" style={{ marginBottom: '1.75rem' }}>
            <form onSubmit={handleCreatePost}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-gold) 0%, #ea580c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#000',
                    flexShrink: 0,
                  }}
                >
                  DBU
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Share an announcement, study question, or campus experience..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Optional media attachment & visibility selector */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    className="form-control"
                    style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    value={postVisibility}
                    onChange={(e) => setPostVisibility(e.target.value as any)}
                  >
                    <option value="CAMPUS">🌐 Campus Wide</option>
                    <option value="FRIENDS_ONLY">🔒 Friends Only</option>
                  </select>

                  <input
                    type="url"
                    className="form-control"
                    placeholder="Image URL (optional)"
                    style={{ width: '220px', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    value={postMediaUrl}
                    onChange={(e) => setPostMediaUrl(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {postContent.length} / 3000
                  </span>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !postContent.trim()}
                  >
                    {isSubmitting ? (
                      <span className="loading-spinner" />
                    ) : (
                      <>
                        <Send size={15} /> Publish Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {feedbackMessage && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background:
                    feedbackMessage.type === 'success'
                      ? 'var(--accent-emerald-light)'
                      : 'var(--accent-rose-light)',
                  color:
                    feedbackMessage.type === 'success'
                      ? 'var(--accent-emerald)'
                      : 'var(--accent-rose)',
                  border: `1px solid ${
                    feedbackMessage.type === 'success'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(244, 63, 94, 0.3)'
                  }`,
                }}
              >
                {feedbackMessage.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {feedbackMessage.text}
              </div>
            )}
          </div>

          {/* Quick Shortcuts Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              marginBottom: '1.75rem',
            }}
          >
            <a
              href="/menilik"
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '1rem',
                borderColor: 'rgba(245, 158, 11, 0.25)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(13, 22, 40, 0.7) 100%)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--primary-gold-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-gold)',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>Menilik AI Assistant</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official DBU policy queries & handbook RAG</div>
              </div>
            </a>

            <a
              href="/marketplace"
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '1rem',
                borderColor: 'rgba(56, 189, 248, 0.25)',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(13, 22, 40, 0.7) 100%)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                }}
              >
                <ShoppingBag size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>Campus Marketplace</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student textbooks, dorm gear, electronics</div>
              </div>
            </a>
          </div>

          {/* Feed Posts */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
              <div style={{ marginTop: '0.75rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Loading verified campus discussions...
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="card empty-state">
              <Globe className="empty-state-icon" />
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
                No posts yet
              </div>
              <div style={{ fontSize: '0.85rem', maxWidth: '380px' }}>
                Be the first to share something with your Debre Berhan University community.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {posts.map((post) => (
                <article key={post.id} className="card">
                  {/* Author Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--accent-blue)',
                          fontSize: '0.95rem',
                        }}
                      >
                        {post.author.displayName[0] || 'U'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.925rem', color: '#fff' }}>
                            {post.author.displayName}
                          </span>
                          {post.author.role !== 'STUDENT' && (
                            <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                              {post.author.role}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {post.author.department} •{' '}
                          {new Date(post.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      {post.visibility === 'CAMPUS' ? <Globe size={14} /> : <Lock size={14} />}
                      <span>{post.visibility === 'CAMPUS' ? 'Campus' : 'Friends'}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      fontSize: '0.925rem',
                      lineHeight: '1.55',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-line',
                      marginBottom: post.mediaUrl ? '0.875rem' : '1rem',
                    }}
                  >
                    {post.content}
                  </div>

                  {/* Media (if attached) */}
                  {post.mediaUrl && (
                    <div
                      style={{
                        marginBottom: '1rem',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        maxHeight: '360px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <img
                        src={post.mediaUrl}
                        alt="Campus post media"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Post Actions Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {/* Like Action */}
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: post.hasLiked ? 'var(--accent-rose)' : 'var(--text-muted)',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          transition: 'color var(--transition-fast)',
                        }}
                      >
                        <Heart
                          size={18}
                          fill={post.hasLiked ? 'var(--accent-rose)' : 'none'}
                          color={post.hasLiked ? 'var(--accent-rose)' : 'currentColor'}
                        />
                        <span>{post.likeCount}</span>
                      </button>

                      {/* Comment Toggle */}
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.825rem',
                          fontWeight: 500,
                        }}
                      >
                        <MessageCircle size={18} />
                        <span>{post.commentCount}</span>
                      </button>

                      {/* Share Action */}
                      <button
                        onClick={() => handleShare(post.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.825rem',
                          fontWeight: 500,
                        }}
                      >
                        <Share2 size={17} />
                        <span>{post.shareCount}</span>
                      </button>
                    </div>

                    <a
                      href={`/marketplace`}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      Report
                    </a>
                  </div>

                  {/* Expandable Comment Drawer */}
                  {activeCommentPostId === post.id && (
                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Comments list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(commentsMap[post.id] || []).length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            No comments yet. Write the first response!
                          </div>
                        ) : (
                          (commentsMap[post.id] || []).map((c) => (
                            <div
                              key={c.id}
                              style={{
                                padding: '0.65rem 0.875rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--accent-blue)' }}>
                                  {c.author.displayName}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {c.content}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add comment input */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Write a constructive response..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                        />
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInput.trim()}
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
