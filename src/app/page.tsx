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
  Sparkles,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  PlusSquare,
  Image as ImageIcon,
  Video,
  ShieldCheck,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface PostItem {
  id: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch {
      // Unauthenticated visitor
    }
  };

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
    fetchCurrentUser();
    fetchPosts();
  }, []);

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
        setFeedbackMessage({ type: 'success', text: 'Post link copied to campus clipboard.' });
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isVideoPost = (post: PostItem) => {
    if (post.mediaType === 'VIDEO') return true;
    if (post.mediaUrl && /\.(mp4|webm|mov)$/i.test(post.mediaUrl)) return true;
    return false;
  };

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Home" />

        <div className="app-content">
          {/* Feedback Alert if Share / Action */}
          {feedbackMessage && (
            <div
              style={{
                marginBottom: '1.25rem',
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
              <CheckCircle size={16} />
              {feedbackMessage.text}
            </div>
          )}

          {/* Personalized Welcome Area */}
          <div
            className="card"
            style={{
              marginBottom: '1.5rem',
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(19, 32, 56, 0.85) 0%, rgba(7, 13, 25, 0.95) 100%)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  {currentUser ? `Welcome back, ${currentUser.profile?.displayName || 'Student'}!` : 'Welcome to DBU Connect'}
                </h2>
                <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                  <ShieldCheck size={12} /> Debre Berhan University
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {currentUser?.profile?.department
                  ? `${currentUser.profile.department} • Stay connected with your campus peers and faculty notices.`
                  : 'Your official digital hub for campus discussions, marketplace, and student connections.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href="/create" className="btn btn-primary" style={{ fontSize: '0.825rem', gap: '0.4rem' }}>
                <PlusSquare size={16} /> Create Post
              </a>
              <a href="/students" className="btn btn-secondary" style={{ fontSize: '0.825rem', gap: '0.4rem' }}>
                <UserCheck size={16} /> Discover Students
              </a>
            </div>
          </div>

          {/* Dedicated Quick Post-Creation Entry Point */}
          <div
            className="card"
            style={{
              marginBottom: '1.75rem',
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-blue) 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                  fontSize: '0.9rem',
                }}
              >
                {currentUser?.profile?.displayName?.[0] || 'D'}
              </div>
              <a
                href="/create"
                style={{
                  flex: 1,
                  padding: '0.75rem 1.15rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-dim)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                What's happening across Debre Berhan University? Share a post...
              </a>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href="/create"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.825rem',
                    color: 'var(--accent-blue)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(56, 189, 248, 0.08)',
                  }}
                >
                  <ImageIcon size={16} /> Photo
                </a>
                <a
                  href="/create"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.825rem',
                    color: 'var(--primary-gold)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.08)',
                  }}
                >
                  <Video size={16} /> Video
                </a>
              </div>

              <a
                href="/create"
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Publish <ArrowRight size={14} />
              </a>
            </div>
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official DBU Senate legislation & academic RAG</div>
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
                No campus posts yet
              </div>
              <div style={{ fontSize: '0.85rem', maxWidth: '380px', color: 'var(--text-muted)' }}>
                Be the first to share an academic inquiry, club activity, or campus announcement.
              </div>
              <a href="/create" className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                <PlusSquare size={16} /> Create First Post
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {posts.map((post) => {
                const isVideo = isVideoPost(post);

                return (
                  <article key={post.id} className="card">
                    {/* Author Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <a
                          href={`/profile?userId=${post.author.id}`}
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
                            flexShrink: 0,
                          }}
                        >
                          {post.author.displayName[0] || 'U'}
                        </a>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <a
                              href={`/profile?userId=${post.author.id}`}
                              style={{ fontWeight: 700, fontSize: '0.925rem', color: '#fff' }}
                            >
                              {post.author.displayName}
                            </a>
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

                    {/* Media Container: Real Video or Image Display */}
                    {post.mediaUrl && (
                      <div
                        style={{
                          marginBottom: '1rem',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          border: '1px solid var(--border-subtle)',
                          background: '#000',
                        }}
                      >
                        {isVideo ? (
                          <video
                            controls
                            playsInline
                            preload="metadata"
                            src={post.mediaUrl}
                            style={{
                              width: '100%',
                              maxHeight: '460px',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <img
                            src={post.mediaUrl}
                            alt="Campus post media"
                            style={{
                              width: '100%',
                              maxHeight: '440px',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        )}
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
                            padding: '0.4rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            background: post.hasLiked ? 'var(--accent-rose-light)' : 'transparent',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <Heart
                            size={16}
                            fill={post.hasLiked ? 'var(--accent-rose)' : 'none'}
                          />
                          <span>{post.likeCount}</span>
                        </button>

                        {/* Comment Action */}
                        <button
                          onClick={() => handleToggleComments(post.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color:
                              activeCommentPostId === post.id
                                ? 'var(--accent-blue)'
                                : 'var(--text-muted)',
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            padding: '0.4rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            background:
                              activeCommentPostId === post.id
                                ? 'rgba(56, 189, 248, 0.1)'
                                : 'transparent',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <MessageCircle size={16} />
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
                            fontWeight: 600,
                            padding: '0.4rem 0.6rem',
                          }}
                          title="Share post"
                        >
                          <Share2 size={16} />
                          <span>{post.shareCount > 0 ? post.shareCount : ''}</span>
                        </button>
                      </div>

                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                        DBU Connect
                      </div>
                    </div>

                    {/* Comments Section Drawer */}
                    {activeCommentPostId === post.id && (
                      <div
                        style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        {/* Comments list */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                            marginBottom: '1rem',
                            maxHeight: '260px',
                            overflowY: 'auto',
                          }}
                        >
                          {(commentsMap[post.id] || []).length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem 0' }}>
                              No comments yet. Start the academic discussion!
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
                            className="input-field"
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
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
