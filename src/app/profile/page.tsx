'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  User,
  Edit3,
  BookOpen,
  Calendar,
  ShieldCheck,
  ShoppingBag,
  Heart,
  MessageCircle,
  X,
  CheckCircle,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  AlertCircle,
  Check,
  Loader2,
  Globe,
  Lock,
} from 'lucide-react';

interface ProfileData {
  userId: string;
  role: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  department: string;
  graduationYear?: number | null;
  privacyLevel: string;
  createdAt: string;
  stats: {
    postCount: number;
    listingCount: number;
    friendCount: number;
  };
  relationship: {
    state: 'SELF' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'CAN_REQUEST';
    isSelf: boolean;
    isFriend: boolean;
    sentRequestId: string | null;
    receivedRequestId: string | null;
  };
  posts: Array<{
    id: string;
    content: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    visibility: string;
    shareCount: number;
    createdAt: string;
    author: {
      displayName: string;
      avatarUrl?: string | null;
      department: string;
    };
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
  }>;
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetUserId = searchParams.get('userId');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Profile Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meRes.ok || !meData?.user) {
        router.push('/login');
        return;
      }
      setCurrentUser(meData.user);

      // Determine whose profile to fetch
      const profileTargetId = targetUserId || meData.user.id;
      const res = await fetch(`/api/users/${profileTargetId}/profile`);
      const data = await res.json();

      if (res.ok && data?.profile) {
        setProfile(data.profile);
        setDisplayName(data.profile.displayName);
        setBio(data.profile.bio || '');
        setDepartment(data.profile.department || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedListings = async () => {
    try {
      const res = await fetch('/api/marketplace/saved');
      const data = await res.json();
      if (data?.savedListings) {
        setSavedListings(data.savedListings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    if (!targetUserId) {
      fetchSavedListings();
    }
  }, [targetUserId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio, department }),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Profile updated successfully.' });
        setIsEditModalOpen(false);
        fetchProfile();
      } else {
        const data = await res.json();
        setStatusMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  // Friend Request Lifecycle Handlers
  const handleSendFriendRequest = async () => {
    if (!profile) return;
    try {
      setActionPending(true);
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.userId }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Friend request sent successfully!' });
        fetchProfile();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Could not send request.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to send friend request.' });
    } finally {
      setActionPending(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!profile?.relationship.sentRequestId) return;
    try {
      setActionPending(true);
      const res = await fetch(`/api/friends/${profile.relationship.sentRequestId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Friend request cancelled.' });
        fetchProfile();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to cancel request.' });
    } finally {
      setActionPending(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!profile?.relationship.receivedRequestId) return;
    try {
      setActionPending(true);
      const res = await fetch(`/api/friends/${profile.relationship.receivedRequestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT' }),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Friend request accepted! You are now connected.' });
        fetchProfile();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to accept request.' });
    } finally {
      setActionPending(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    if (!confirm(`Are you sure you want to disconnect from ${profile.displayName}?`)) return;

    try {
      setActionPending(true);
      const res = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.userId }),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Connection removed.' });
        fetchProfile();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to remove connection.' });
    } finally {
      setActionPending(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const isVideo = (mediaUrl?: string | null, mediaType?: string | null) => {
    if (mediaType === 'VIDEO') return true;
    if (mediaUrl && /\.(mp4|webm|mov)$/i.test(mediaUrl)) return true;
    return false;
  };

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title={profile?.relationship.isSelf ? 'My Student Profile' : 'Student Profile'} />

        <div className="app-content">
          {/* Feedback Toast */}
          {statusMessage && (
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
                  statusMessage.type === 'success'
                    ? 'var(--accent-emerald-light)'
                    : 'var(--accent-rose-light)',
                color:
                  statusMessage.type === 'success'
                    ? 'var(--accent-emerald)'
                    : 'var(--accent-rose)',
                border: `1px solid ${
                  statusMessage.type === 'success'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(244, 63, 94, 0.3)'
                }`,
              }}
            >
              {statusMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {statusMessage.text}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div className="loading-spinner" style={{ width: '36px', height: '36px' }} />
              <div style={{ marginTop: '0.875rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Loading profile credentials...
              </div>
            </div>
          ) : profile ? (
            <>
              {/* Profile Card Header */}
              <div className="card" style={{ marginBottom: '1.75rem', position: 'relative' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
                  <div
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-blue) 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#fff',
                      fontSize: '2.2rem',
                      boxShadow: 'var(--shadow-glow)',
                      flexShrink: 0,
                    }}
                  >
                    {profile.displayName[0] || 'U'}
                  </div>

                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                        {profile.displayName}
                      </h2>
                      <span className="badge badge-gold">{profile.role}</span>
                      <span className="badge badge-emerald">
                        <ShieldCheck size={12} /> Verified DBU Student
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {profile.department}
                      {profile.graduationYear ? ` • Graduating Class of ${profile.graduationYear}` : ''}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.45', maxWidth: '650px' }}>
                      {profile.bio || 'Verified Debre Berhan University student profile.'}
                    </p>
                  </div>

                  {/* Top Action Button: Edit Profile OR Friend Relationship Action */}
                  <div style={{ alignSelf: 'flex-start' }}>
                    {profile.relationship.isSelf ? (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setIsEditModalOpen(true)}
                        style={{ fontSize: '0.85rem' }}
                      >
                        <Edit3 size={15} /> Edit Profile
                      </button>
                    ) : profile.relationship.state === 'FRIENDS' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <a
                          href={`/inbox?user=${profile.userId}`}
                          className="btn btn-primary"
                          style={{ fontSize: '0.85rem' }}
                        >
                          <MessageSquare size={15} /> Message
                        </a>
                        <button
                          onClick={handleRemoveFriend}
                          disabled={actionPending}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8rem', color: 'var(--accent-rose)' }}
                          title="Remove Connection"
                        >
                          Remove Friend
                        </button>
                      </div>
                    ) : profile.relationship.state === 'REQUEST_SENT' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="badge badge-gold" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                          <Clock size={14} /> Request Sent
                        </span>
                        <button
                          onClick={handleCancelFriendRequest}
                          disabled={actionPending}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : profile.relationship.state === 'REQUEST_RECEIVED' ? (
                      <button
                        onClick={handleAcceptFriendRequest}
                        disabled={actionPending}
                        className="btn btn-primary"
                        style={{ fontSize: '0.85rem' }}
                      >
                        {actionPending ? <Loader2 size={15} className="spinner" /> : <UserCheck size={15} />}
                        Accept Friend Request
                      </button>
                    ) : (
                      <button
                        onClick={handleSendFriendRequest}
                        disabled={actionPending}
                        className="btn btn-primary"
                        style={{ fontSize: '0.85rem' }}
                      >
                        {actionPending ? <Loader2 size={15} className="spinner" /> : <UserPlus size={15} />}
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>

                {/* Counters Bar */}
                <div
                  style={{
                    display: 'flex',
                    gap: '2.5rem',
                    marginTop: '1.5rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                      {profile.stats.postCount}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.4rem' }}>
                      Campus Posts
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-gold)' }}>
                      {profile.stats.listingCount}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.4rem' }}>
                      Market Listings
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                      {profile.stats.friendCount}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.4rem' }}>
                      Campus Connections
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs Bar */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  className={`btn ${activeTab === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('posts')}
                  style={{ fontSize: '0.85rem' }}
                >
                  {profile.relationship.isSelf ? 'My Campus Posts' : `${profile.displayName}'s Posts`} ({profile.posts.length})
                </button>

                {profile.relationship.isSelf && (
                  <button
                    className={`btn ${activeTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('saved')}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Saved Listings ({savedListings.length})
                  </button>
                )}
              </div>

              {/* POSTS TAB */}
              {activeTab === 'posts' && (
                <div>
                  {profile.posts.length === 0 ? (
                    <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No campus posts published yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {profile.posts.map((post) => {
                        const hasVideo = isVideo(post.mediaUrl, post.mediaType);

                        return (
                          <article key={post.id} className="card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                {new Date(post.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                {post.visibility === 'CAMPUS' ? <Globe size={13} /> : <Lock size={13} />}
                                <span>{post.visibility === 'CAMPUS' ? 'Campus' : 'Friends'}</span>
                              </div>
                            </div>

                            <p style={{ fontSize: '0.925rem', lineHeight: '1.55', color: 'var(--text-secondary)', marginBottom: post.mediaUrl ? '0.75rem' : '1rem' }}>
                              {post.content}
                            </p>

                            {post.mediaUrl && (
                              <div
                                style={{
                                  borderRadius: 'var(--radius-md)',
                                  overflow: 'hidden',
                                  marginBottom: '0.875rem',
                                  border: '1px solid var(--border-subtle)',
                                  background: '#000',
                                }}
                              >
                                {hasVideo ? (
                                  <video
                                    controls
                                    playsInline
                                    preload="metadata"
                                    src={post.mediaUrl}
                                    style={{ width: '100%', maxHeight: '440px', display: 'block' }}
                                  />
                                ) : (
                                  <img
                                    src={post.mediaUrl}
                                    alt="Post media"
                                    style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block' }}
                                  />
                                )}
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Heart size={15} /> {post.likeCount} Likes
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <MessageCircle size={15} /> {post.commentCount} Comments
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SAVED LISTINGS TAB (Owner only) */}
              {activeTab === 'saved' && profile.relationship.isSelf && (
                <div>
                  {savedListings.length === 0 ? (
                    <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No saved marketplace listings yet. Browse the campus marketplace to bookmark items!
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      {savedListings.map((item) => (
                        <div key={item.id} className="card" style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.25rem' }}>
                            {item.listing?.title}
                          </div>
                          <div style={{ color: 'var(--primary-gold)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                            {item.listing?.price} ETB
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                            {item.listing?.category} • {item.listing?.condition}
                          </p>
                          <a href="/marketplace" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.78rem' }}>
                            View in Marketplace
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Edit Profile Modal */}
              {isEditModalOpen && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                  }}
                >
                  <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                        Edit Student Profile
                      </h3>
                      <button onClick={() => setIsEditModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Display Name
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Academic Department
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Computer Science, Medicine..."
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Short Biography
                        </label>
                        <textarea
                          className="input-field"
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell fellow students about your academic interests, projects, or clubs..."
                          style={{ width: '100%', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setIsEditModalOpen(false)}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? <Loader2 size={15} className="spinner" /> : null} Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>
                Profile Not Found
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                The requested student profile could not be located.
              </p>
              <a href="/students" className="btn btn-primary">
                Return to Student Directory
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="loading-spinner" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
