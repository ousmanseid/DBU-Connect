'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  X,
  MessageSquare,
  ShieldCheck,
  GraduationCap,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface StudentCardItem {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  department: string;
  bio: string;
  graduationYear?: number | null;
  relationship: {
    state: 'SELF' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'CAN_REQUEST';
    isSelf: boolean;
    isFriend: boolean;
    sentRequestId: string | null;
    receivedRequestId: string | null;
  };
}

const DEPARTMENTS = [
  'ALL',
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Electrical and Computer Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Medicine',
  'Public Health',
  'Nursing',
  'Economics',
  'Accounting and Finance',
  'Management',
  'Law',
  'Agricultural Sciences',
];

function StudentsDirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedDept, setSelectedDept] = useState(searchParams.get('department') || 'ALL');
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState<StudentCardItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fetchStudents = async (searchQ: string, dept: string, pageNum: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set('q', searchQ.trim());
      if (dept && dept !== 'ALL') params.set('department', dept);
      params.set('page', pageNum.toString());
      params.set('limit', '12');

      const res = await fetch(`/api/users/search?${params.toString()}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Directory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const deptParam = searchParams.get('department') || 'ALL';
    setQuery(qParam);
    setSelectedDept(deptParam);
    fetchStudents(qParam, deptParam, page);
  }, [searchParams, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents(query, selectedDept, 1);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedDept('ALL');
    setPage(1);
    fetchStudents('', 'ALL', 1);
  };

  // Friend Request Actions
  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: true }));
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusNotice('Friend request sent!');
        setStudents((prev) =>
          prev.map((s) =>
            s.id === targetUserId
              ? {
                  ...s,
                  relationship: {
                    ...s.relationship,
                    state: 'REQUEST_SENT',
                    sentRequestId: data.requestId,
                  },
                }
              : s
          )
        );
      } else {
        setStatusNotice(data.message || 'Could not send request.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: false }));
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleCancelRequest = async (requestId: string, targetUserId: string) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: true }));
      const res = await fetch(`/api/friends/${requestId}`, { method: 'DELETE' });

      if (res.ok) {
        setStatusNotice('Friend request cancelled.');
        setStudents((prev) =>
          prev.map((s) =>
            s.id === targetUserId
              ? {
                  ...s,
                  relationship: {
                    ...s.relationship,
                    state: 'CAN_REQUEST',
                    sentRequestId: null,
                  },
                }
              : s
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: false }));
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleAcceptRequest = async (requestId: string, targetUserId: string) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: true }));
      const res = await fetch(`/api/friends/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT' }),
      });

      if (res.ok) {
        setStatusNotice('Friend request accepted! You are now connected.');
        setStudents((prev) =>
          prev.map((s) =>
            s.id === targetUserId
              ? {
                  ...s,
                  relationship: {
                    ...s.relationship,
                    state: 'FRIENDS',
                    isFriend: true,
                    receivedRequestId: null,
                  },
                }
              : s
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: false }));
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Discover Students" />

        <div className="app-content">
          {/* Header Banner */}
          <div
            className="card"
            style={{
              marginBottom: '1.5rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(19, 32, 56, 0.9) 0%, rgba(7, 13, 25, 0.95) 100%)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
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
                <Users size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  Student Directory & Campus Network
                </h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Discover verified Debre Berhan University students, connect across departments, and collaborate.
                </p>
              </div>
            </div>

            {/* Search and Filter Form */}
            <form onSubmit={handleSearchSubmit} style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                {/* Search text input */}
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-dim)',
                    }}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by student name, department, or interests..."
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', width: '100%' }}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-dim)',
                      }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Department Dropdown */}
                <div style={{ minWidth: '200px' }}>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept === 'ALL' ? 'All University Departments' : dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  Search Directory
                </button>
                {(query || selectedDept !== 'ALL') && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Status Feedback Toast */}
          {statusNotice && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--accent-emerald-light)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Check size={16} />
              {statusNotice}
            </div>
          )}

          {/* Directory Count Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: 'var(--text-dim)',
            }}
          >
            <div>
              Showing <span style={{ color: '#fff', fontWeight: 600 }}>{students.length}</span> of{' '}
              <span style={{ color: '#fff', fontWeight: 600 }}>{total}</span> registered student profiles
            </div>
            {totalPages > 1 && (
              <div>
                Page {page} of {totalPages}
              </div>
            )}
          </div>

          {/* Results Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
              <div className="loading-spinner" style={{ width: '36px', height: '36px' }} />
              <div style={{ marginTop: '0.875rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Searching official student registry...
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="card empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Users className="empty-state-icon" style={{ margin: '0 auto 1rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.35rem' }}>
                No students found
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
                No active students matched your search criteria. Try a broader search term or choose "All University Departments".
              </p>
              <button onClick={handleClear} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                Reset Search
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {students.map((student) => {
                const isActionPending = actionLoadingMap[student.id];
                const { relationship } = student;

                return (
                  <div
                    key={student.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1.25rem',
                      border: '1px solid var(--border-subtle)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    <div>
                      {/* Student Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '0.75rem' }}>
                        <a
                          href={`/profile?userId=${student.id}`}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent-blue) 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#fff',
                            fontSize: '1.2rem',
                            flexShrink: 0,
                          }}
                        >
                          {student.displayName[0] || 'S'}
                        </a>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <a
                              href={`/profile?userId=${student.id}`}
                              style={{
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: '#fff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {student.displayName}
                            </a>
                            {relationship.isSelf && (
                              <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                                You
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                            {student.department}
                            {student.graduationYear ? ` • Class of ${student.graduationYear}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Bio snippet */}
                      <p
                        style={{
                          fontSize: '0.825rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.45',
                          marginBottom: '1rem',
                          minHeight: '2.4em',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {student.bio || 'Verified Debre Berhan University student.'}
                      </p>
                    </div>

                    {/* Action Buttons Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '0.875rem',
                        borderTop: '1px solid var(--border-subtle)',
                        gap: '0.5rem',
                      }}
                    >
                      <a
                        href={`/profile?userId=${student.id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                      >
                        View Profile
                      </a>

                      {/* Relationship action button */}
                      <div>
                        {relationship.isSelf ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            Your Account
                          </span>
                        ) : relationship.state === 'FRIENDS' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                              <UserCheck size={12} /> Connected
                            </span>
                            <a
                              href={`/inbox?user=${student.id}`}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }}
                              title="Send Message"
                            >
                              <MessageSquare size={13} />
                            </a>
                          </div>
                        ) : relationship.state === 'REQUEST_SENT' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span
                              className="badge badge-gold"
                              style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Clock size={12} /> Request Sent
                            </span>
                            <button
                              onClick={() => handleCancelRequest(relationship.sentRequestId!, student.id)}
                              disabled={isActionPending}
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-dim)',
                                textDecoration: 'underline',
                                padding: '0.2rem',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : relationship.state === 'REQUEST_RECEIVED' ? (
                          <button
                            onClick={() => handleAcceptRequest(relationship.receivedRequestId!, student.id)}
                            disabled={isActionPending}
                            className="btn btn-primary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                          >
                            {isActionPending ? <Loader2 size={13} className="spinner" /> : <UserCheck size={13} />}
                            Accept Request
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(student.id)}
                            disabled={isActionPending}
                            className="btn btn-primary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                          >
                            {isActionPending ? <Loader2 size={13} className="spinner" /> : <UserPlus size={13} />}
                            Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '2rem',
              }}
            >
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ fontSize: '0.85rem' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{ fontSize: '0.85rem' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function StudentsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="loading-spinner" />
        </div>
      }
    >
      <StudentsDirectoryContent />
    </Suspense>
  );
}
