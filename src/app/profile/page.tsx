'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProfile = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData?.user) {
        setCurrentUser(meData.user);
        const profileRes = await fetch(`/api/users/${meData.user.id}/profile`);
        const profileData = await profileRes.json();
        if (profileData?.profile) {
          setProfile(profileData.profile);
          setDisplayName(profileData.profile.displayName);
          setBio(profileData.profile.bio || '');
          setDepartment(profileData.profile.department || '');
        }
      }
    } catch (err) {
      console.error(err);
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
    fetchSavedListings();
  }, []);

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
        setSuccessMsg('Profile updated successfully.');
        setIsEditModalOpen(false);
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Student Profile" />

        <div className="app-content">
          {profile ? (
            <>
              {/* Profile Card Header */}
              <div className="card" style={{ marginBottom: '1.75rem', position: 'relative' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
                  <div
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-blue) 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#fff',
                      fontSize: '2rem',
                      boxShadow: 'var(--shadow-glow)',
                      flexShrink: 0,
                    }}
                  >
                    {profile.displayName[0] || 'U'}
                  </div>

                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                        {profile.displayName}
                      </h2>
                      <span className="badge badge-gold">{profile.role}</span>
                      <span className="badge badge-emerald">
                        <ShieldCheck size={12} /> Verified DBU Student
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {profile.department} • Graduating Class of {profile.graduationYear || '2026'}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.45', maxWidth: '650px' }}>
                      {profile.bio || 'No biography written yet.'}
                    </p>
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsEditModalOpen(true)}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Edit3 size={15} /> Edit Profile
                  </button>
                </div>

                {/* Counters Bar */}
                <div
                  style={{
                    display: 'flex',
                    gap: '2rem',
                    marginTop: '1.5rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                      {profile.stats.postCount}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.35rem' }}>
                      Posts
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-gold)' }}>
                      {profile.stats.listingCount}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.35rem' }}>
                      Listings
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                      {profile.stats.friendCount}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.35rem' }}>
                      Campus Connections
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  className={`btn ${activeTab === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('posts')}
                >
                  My Campus Posts
                </button>
                <button
                  className={`btn ${activeTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('saved')}
                >
                  Saved Marketplace Items ({savedListings.length})
                </button>
              </div>

              {activeTab === 'posts' ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <BookOpen size={40} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem auto' }} />
                  <div style={{ fontWeight: 600, color: '#fff' }}>Your Published Campus Posts</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Posts published to the university community are visible on the campus feed.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {savedListings.length === 0 ? (
                    <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
                      <ShoppingBag className="empty-state-icon" />
                      <div style={{ fontWeight: 600, color: '#fff' }}>No saved items</div>
                      <div style={{ fontSize: '0.85rem' }}>
                        Browse the marketplace and bookmark items you want to keep track of.
                      </div>
                    </div>
                  ) : (
                    savedListings.map((item) => (
                      <div key={item.id} className="card">
                        <span className="badge badge-gold" style={{ fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                          {item.category}
                        </span>
                        <h4 style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>
                          {item.title}
                        </h4>
                        <div style={{ color: 'var(--primary-gold)', fontWeight: 800, marginBottom: '0.5rem' }}>
                          {item.price} ETB
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                          {item.description}
                        </p>
                        <a href="/marketplace" className="btn btn-secondary" style={{ fontSize: '0.75rem', width: '100%' }}>
                          View in Marketplace
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Edit Modal */}
              {isEditModalOpen && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    zIndex: 100,
                  }}
                >
                  <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Edit Personal Profile</h3>
                      <button onClick={() => setIsEditModalOpen(false)} style={{ color: 'var(--text-dim)' }}>
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                      <div className="form-group">
                        <label className="form-label">Display Name</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Department / Field of Study</label>
                        <input
                          type="text"
                          className="form-control"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Biography</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Brief introduction about your interests, clubs, or research..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setIsEditModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? <span className="loading-spinner" /> : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
              <div style={{ marginTop: '0.75rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Loading profile details...
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
