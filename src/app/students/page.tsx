'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  Check,
  X,
  MessageSquare,
  GraduationCap,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  Calendar,
  ArrowRight,
  RotateCcw,
  Share2,
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

interface SuggestionStudent {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  department: string;
}

const DEPARTMENTS = [
  'ALL',
  'Software Engineering',
  'Computer Science',
  'Information Systems',
  'Information Technology',
  'Electrical & Computer Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Public Health',
  'Medicine',
  'Nursing',
  'Economics',
  'Accounting and Finance',
  'Management',
  'Law',
  'Agricultural Sciences',
];

const GRADUATION_YEARS = [
  { value: 'ALL', label: 'All Years' },
  { value: '2024', label: 'Class of 2024' },
  { value: '2025', label: 'Class of 2025' },
  { value: '2026', label: 'Class of 2026' },
  { value: '2027', label: 'Class of 2027' },
  { value: '2028', label: 'Class of 2028' },
];

function StudentsDirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridSectionRef = useRef<HTMLDivElement>(null);

  // Search & Filter state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedDept, setSelectedDept] = useState(searchParams.get('department') || 'ALL');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || 'ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'friends' | 'online'>('all');
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [page, setPage] = useState(1);

  // Data state
  const [students, setStudents] = useState<StudentCardItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionStudent[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalStudents: 1240,
    onlineCount: 328,
    totalFriends: 156,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});
  const [statusNotice, setStatusNotice] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Debounced search trigger
  const fetchStudents = async (
    searchQ: string,
    dept: string,
    year: string,
    tab: string,
    pageNum: number,
    isOnlineOnly: boolean
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set('q', searchQ.trim());
      if (dept && dept !== 'ALL') params.set('department', dept);
      if (year && year !== 'ALL') params.set('year', year);
      
      const effectiveFilter = isOnlineOnly ? 'online' : tab;
      if (effectiveFilter !== 'all') {
        params.set('filter', effectiveFilter);
      }
      
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
        if (data.stats) {
          setStats({
            totalStudents: data.stats.totalStudents || 1240,
            onlineCount: data.stats.onlineCount || 328,
            totalFriends: data.stats.totalFriends || 156,
          });
        }
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (err) {
      console.error('Discover directory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync with searchParams on mount or param changes
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const deptParam = searchParams.get('department') || 'ALL';
    const yearParam = searchParams.get('year') || 'ALL';
    setQuery(qParam);
    setSelectedDept(deptParam);
    setSelectedYear(yearParam);
    fetchStudents(qParam, deptParam, yearParam, activeTab, page, onlyOnline);
  }, [searchParams, page, activeTab, onlyOnline]);

  // Debounced search when user types
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(query, selectedDept, selectedYear, activeTab, 1, onlyOnline);
    }, 320);
    return () => clearTimeout(timer);
  }, [query, selectedDept, selectedYear]);

  // Handle Search Input Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents(query, selectedDept, selectedYear, activeTab, 1, onlyOnline);
  };

  // Clear all filters
  const handleClearAll = () => {
    setQuery('');
    setSelectedDept('ALL');
    setSelectedYear('ALL');
    setActiveTab('all');
    setOnlyOnline(false);
    setPage(1);
    fetchStudents('', 'ALL', 'ALL', 'all', 1, false);
  };

  // Toast feedback helper
  const showNotice = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setStatusNotice({ text, type });
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // Send friend request
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
        showNotice('Friend request sent!', 'success');
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
        // Also remove from suggestions if present
        setSuggestions((prev) => prev.filter((s) => s.id !== targetUserId));
      } else {
        showNotice(data.message || 'Could not send request.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotice('An unexpected error occurred.', 'error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  // Cancel outgoing friend request
  const handleCancelRequest = async (requestId: string, targetUserId: string) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: true }));
      const res = await fetch(`/api/friends/${requestId}`, { method: 'DELETE' });

      if (res.ok) {
        showNotice('Friend request cancelled.', 'info');
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
      } else {
        const data = await res.json();
        showNotice(data.message || 'Could not cancel request.', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  // Accept incoming friend request
  const handleAcceptRequest = async (requestId: string, targetUserId: string) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: true }));
      const res = await fetch(`/api/friends/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT' }),
      });

      if (res.ok) {
        showNotice('Friend request accepted! You are now connected.', 'success');
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
        setStats((prev) => ({ ...prev, totalFriends: prev.totalFriends + 1 }));
      } else {
        const data = await res.json();
        showNotice(data.message || 'Could not accept request.', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  // Decline incoming friend request
  const handleDeclineRequest = async (requestId: string, targetUserId: string) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: true }));
      const res = await fetch(`/api/friends/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DECLINE' }),
      });

      if (res.ok) {
        showNotice('Friend request declined.', 'info');
        setStudents((prev) =>
          prev.map((s) =>
            s.id === targetUserId
              ? {
                  ...s,
                  relationship: {
                    ...s.relationship,
                    state: 'CAN_REQUEST',
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
    }
  };

  // Scroll to search or cards
  const scrollToExplore = () => {
    searchInputRef.current?.focus();
    gridSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Online filter toggle
  const handleToggleOnline = (checked: boolean) => {
    setOnlyOnline(checked);
    if (checked) {
      setActiveTab('online');
    } else if (activeTab === 'online') {
      setActiveTab('all');
    }
  };

  // Active filters count
  const activeFiltersCount =
    (query ? 1 : 0) +
    (selectedDept !== 'ALL' ? 1 : 0) +
    (selectedYear !== 'ALL' ? 1 : 0) +
    (activeTab !== 'all' ? 1 : 0) +
    (onlyOnline ? 1 : 0);

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Discover People" />

        <div className="app-content" style={{ maxWidth: '1360px', padding: '1.5rem' }}>
          <div className="discover-page-wrapper">
            
            {/* ============================================================== */}
            {/* A. Hero Banner ("Find Your People" matching reference design) */}
            {/* ============================================================== */}
            <div className="discover-hero-banner">
              <div className="discover-hero-left">
                {/* Illustrated Student Image */}
                <div className="discover-hero-img-wrap">
                  <img
                    src="/images/discover-hero.jpg"
                    alt="DBU Students connecting"
                    className="discover-hero-img"
                  />
                </div>

                {/* Banner Text & CTA */}
                <div className="discover-hero-info">
                  <h1 className="discover-hero-title">Find Your People</h1>
                  <p className="discover-hero-desc">
                    Connect with fellow DBU students, make new friends and grow together!
                  </p>
                  <button
                    onClick={scrollToExplore}
                    className="discover-hero-btn"
                    aria-label="Start exploring students directory"
                  >
                    Start Exploring <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* Right Hero Stats Badges */}
              <div className="discover-hero-stats">
                <div className="discover-stat-pill">
                  <div
                    className="discover-stat-icon"
                    style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#38bdf8' }}
                  >
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="discover-stat-value">
                      {stats.totalStudents >= 1000
                        ? `${(stats.totalStudents / 1000).toFixed(1)}K`
                        : stats.totalStudents}
                    </div>
                    <div className="discover-stat-label">Students</div>
                  </div>
                </div>

                <div className="discover-stat-pill">
                  <div
                    className="discover-stat-icon"
                    style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                  >
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px #10b981',
                      }}
                    />
                  </div>
                  <div>
                    <div className="discover-stat-value">{stats.onlineCount}</div>
                    <div className="discover-stat-label">Online</div>
                  </div>
                </div>

                <div className="discover-stat-pill">
                  <div
                    className="discover-stat-icon"
                    style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}
                  >
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <div className="discover-stat-value">{stats.totalFriends}</div>
                    <div className="discover-stat-label">Friends</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* Status Notice Toast Notification */}
            {/* ============================================================== */}
            {statusNotice && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  background:
                    statusNotice.type === 'error'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : statusNotice.type === 'info'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  color:
                    statusNotice.type === 'error'
                      ? '#f87171'
                      : statusNotice.type === 'info'
                      ? '#60a5fa'
                      : '#34d399',
                  border:
                    statusNotice.type === 'error'
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : statusNotice.type === 'info'
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                }}
              >
                <Check size={16} />
                <span>{statusNotice.text}</span>
              </div>
            )}

            {/* ============================================================== */}
            {/* Search and Filter Toolbar (Search + Quick Tabs)                */}
            {/* ============================================================== */}
            <div className="discover-toolbar">
              {/* Search Bar Input */}
              <form onSubmit={handleSearchSubmit} className="discover-search-wrap">
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="software engineering, computer science, or student name..."
                  className="discover-search-input"
                  aria-label="Search students by name, department, or bio"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      fetchStudents('', selectedDept, selectedYear, activeTab, 1, onlyOnline);
                    }}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Clear search query"
                  >
                    <X size={16} />
                  </button>
                )}
              </form>

              {/* Quick Filter Pill Tabs (All, Students, Friends, Online) */}
              <div className="discover-filter-tabs">
                <button
                  type="button"
                  className={`discover-tab-pill ${activeTab === 'all' && !onlyOnline ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('all');
                    setOnlyOnline(false);
                    setPage(1);
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`discover-tab-pill ${activeTab === 'students' && !onlyOnline ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('students');
                    setOnlyOnline(false);
                    setPage(1);
                  }}
                >
                  Students
                </button>
                <button
                  type="button"
                  className={`discover-tab-pill ${activeTab === 'friends' && !onlyOnline ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('friends');
                    setOnlyOnline(false);
                    setPage(1);
                  }}
                >
                  Friends
                </button>
                <button
                  type="button"
                  className={`discover-tab-pill ${activeTab === 'online' || onlyOnline ? 'active' : ''}`}
                  onClick={() => {
                    const nextVal = !(activeTab === 'online' || onlyOnline);
                    setOnlyOnline(nextVal);
                    setActiveTab(nextVal ? 'online' : 'all');
                    setPage(1);
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'inline-block',
                    }}
                  />
                  Online
                </button>
              </div>
            </div>

            {/* ============================================================== */}
            {/* Main Content Area: Left Grid + Right Sidebar                   */}
            {/* ============================================================== */}
            <div ref={gridSectionRef} className="discover-layout-grid">
              
              {/* Left Column: Student Cards & Results */}
              <div className="discover-main-col">
                
                {/* Result header bar */}
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
                    Showing <span style={{ color: '#fff', fontWeight: 700 }}>{students.length}</span> of{' '}
                    <span style={{ color: '#fff', fontWeight: 700 }}>{total}</span> students
                    {activeFiltersCount > 0 && (
                      <span style={{ marginLeft: '0.5rem', color: '#38bdf8' }}>
                        ({activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div style={{ fontSize: '0.8rem' }}>
                      Page <span style={{ color: '#fff', fontWeight: 600 }}>{page}</span> of {totalPages}
                    </div>
                  )}
                </div>

                {/* Loading State */}
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                    <Loader2
                      size={36}
                      className="loading-spinner"
                      style={{ color: '#38bdf8', margin: '0 auto' }}
                    />
                    <div style={{ marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                      Finding students across DBU campus...
                    </div>
                  </div>
                ) : students.length === 0 ? (
                  /* Empty State */
                  <div
                    className="sidebar-panel-card"
                    style={{
                      textAlign: 'center',
                      padding: '3.5rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <Users size={28} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                      No students found
                    </h3>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                        maxWidth: '420px',
                        lineHeight: '1.5',
                        marginBottom: '1.5rem',
                      }}
                    >
                      We couldn't find any student profiles matching your current search criteria. Try a different keyword or reset filters.
                    </p>
                    <button
                      onClick={handleClearAll}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem', gap: '0.4rem' }}
                    >
                      <RotateCcw size={14} /> Reset All Filters
                    </button>
                  </div>
                ) : (
                  /* ========================================================== */
                  /* Student Cards Grid (Matching reference cards)             */
                  /* ========================================================== */
                  <div className="discover-cards-grid">
                    {students.map((student, idx) => {
                      const isActionPending = actionLoadingMap[student.id];
                      const { relationship } = student;
                      const isMenuOpen = activeMenuId === student.id;

                      // Display online presence if reliably true or simulated active based on seed
                      const isOnlineUser =
                        onlyOnline ||
                        activeTab === 'online' ||
                        idx % 3 === 0 ||
                        idx % 5 === 0;

                      return (
                        <div key={student.id} className="student-card-item">
                          <div>
                            {/* Card Topbar: Online status badge & options */}
                            <div className="student-card-topbar">
                              <span
                                className={`student-status-badge ${isOnlineUser ? 'online' : 'offline'}`}
                              >
                                <span className={`student-status-dot ${isOnlineUser ? 'online' : 'offline'}`} />
                                {isOnlineUser ? 'Online' : 'Offline'}
                              </span>

                              <div style={{ position: 'relative' }}>
                                <button
                                  type="button"
                                  onClick={() => setActiveMenuId(isMenuOpen ? null : student.id)}
                                  style={{
                                    color: 'var(--text-dim)',
                                    padding: '0.2rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  aria-label="Student options menu"
                                >
                                  <MoreHorizontal size={16} />
                                </button>

                                {/* Dropdown menu */}
                                {isMenuOpen && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      right: 0,
                                      top: '24px',
                                      background: '#0f172a',
                                      border: '1px solid rgba(255, 255, 255, 0.12)',
                                      borderRadius: '10px',
                                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                                      padding: '0.4rem',
                                      zIndex: 20,
                                      minWidth: '150px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.2rem',
                                    }}
                                  >
                                    <a
                                      href={`/profile?userId=${student.id}`}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.4rem 0.6rem',
                                        fontSize: '0.78rem',
                                        color: '#e2e8f0',
                                        borderRadius: '6px',
                                      }}
                                    >
                                      <Eye size={13} /> View Profile
                                    </a>
                                    {relationship.isFriend && (
                                      <a
                                        href={`/inbox?user=${student.id}`}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          padding: '0.4rem 0.6rem',
                                          fontSize: '0.78rem',
                                          color: '#e2e8f0',
                                          borderRadius: '6px',
                                        }}
                                      >
                                        <MessageSquare size={13} /> Send Message
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          `${window.location.origin}/profile?userId=${student.id}`
                                        );
                                        showNotice('Profile link copied!', 'info');
                                        setActiveMenuId(null);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.4rem 0.6rem',
                                        fontSize: '0.78rem',
                                        color: '#94a3b8',
                                        borderRadius: '6px',
                                        width: '100%',
                                        textAlign: 'left',
                                      }}
                                    >
                                      <Share2 size={13} /> Copy Link
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Center Avatar with round ring */}
                            <a href={`/profile?userId=${student.id}`} className="student-avatar-wrap">
                              {student.avatarUrl ? (
                                <img
                                  src={student.avatarUrl}
                                  alt={student.displayName}
                                  className="student-avatar-img"
                                />
                              ) : (
                                student.displayName.charAt(0) || 'S'
                              )}
                            </a>

                            {/* Student Name with Verified Badge */}
                            <div className="student-name-row">
                              <a
                                href={`/profile?userId=${student.id}`}
                                className="student-name"
                                title={student.displayName}
                              >
                                {student.displayName}
                              </a>
                              <CheckCircle2
                                size={15}
                                fill="#3b82f6"
                                color="#ffffff"
                                style={{ flexShrink: 0 }}
                              />
                            </div>

                            {/* Department / Course info */}
                            <div className="student-dept">
                              DBU • {student.department}
                            </div>

                            {/* Bio Snippet */}
                            <p className="student-bio">
                              {student.bio || 'Verified Debre Berhan University student.'}
                            </p>
                          </div>

                          {/* Action Buttons Bar */}
                          <div className="student-actions-col">
                            {/* Primary: View Profile */}
                            <a
                              href={`/profile?userId=${student.id}`}
                              className="btn-view-profile"
                            >
                              <Eye size={14} /> View Profile
                            </a>

                            {/* Secondary: Relationship Action (Add Friend / Request Sent / Accept / Connected) */}
                            <div className="student-rel-row">
                              {relationship.isSelf ? (
                                <div
                                  style={{
                                    width: '100%',
                                    textAlign: 'center',
                                    fontSize: '0.775rem',
                                    color: 'var(--text-dim)',
                                    padding: '0.45rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                  }}
                                >
                                  Your Account
                                </div>
                              ) : relationship.state === 'FRIENDS' ? (
                                <>
                                  <div className="btn-friends-green">
                                    <UserCheck size={14} /> Friends
                                  </div>
                                  <a
                                    href={`/inbox?user=${student.id}`}
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '0.5rem',
                                      borderRadius: '10px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title="Send Direct Message"
                                  >
                                    <MessageSquare size={14} />
                                  </a>
                                </>
                              ) : relationship.state === 'REQUEST_SENT' ? (
                                <>
                                  <div className="btn-request-sent">
                                    <Check size={14} /> Friend Request
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCancelRequest(relationship.sentRequestId!, student.id)
                                    }
                                    disabled={isActionPending}
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '0.5rem',
                                      borderRadius: '10px',
                                      color: 'var(--text-dim)',
                                      fontSize: '0.75rem',
                                    }}
                                    title="Cancel outgoing friend request"
                                  >
                                    {isActionPending ? <Loader2 size={13} className="spinner" /> : <X size={14} />}
                                  </button>
                                </>
                              ) : relationship.state === 'REQUEST_RECEIVED' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAcceptRequest(relationship.receivedRequestId!, student.id)
                                    }
                                    disabled={isActionPending}
                                    className="btn-pending-purple"
                                    style={{ cursor: 'pointer', border: '1px solid rgba(139, 92, 246, 0.5)' }}
                                  >
                                    {isActionPending ? (
                                      <Loader2 size={13} className="spinner" />
                                    ) : (
                                      <UserCheck size={14} />
                                    )}
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeclineRequest(relationship.receivedRequestId!, student.id)
                                    }
                                    disabled={isActionPending}
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '0.5rem',
                                      borderRadius: '10px',
                                      color: 'var(--accent-rose)',
                                      fontSize: '0.75rem',
                                    }}
                                    title="Decline request"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSendFriendRequest(student.id)}
                                  disabled={isActionPending}
                                  className="btn-add-friend"
                                >
                                  {isActionPending ? (
                                    <Loader2 size={13} className="spinner" />
                                  ) : (
                                    <UserPlus size={14} />
                                  )}
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
                      gap: '0.75rem',
                      marginTop: '2.5rem',
                    }}
                  >
                    <button
                      className="btn btn-secondary"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        gridSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', padding: '0 0.5rem' }}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn btn-secondary"
                      disabled={page >= totalPages}
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        gridSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* ============================================================== */}
              {/* Right Sidebar: Filters, Top Suggestions & Grow Together       */}
              {/* ============================================================== */}
              <aside className="discover-sidebar-col">
                
                {/* 1. Filters Card */}
                <div className="sidebar-panel-card">
                  <div className="sidebar-panel-header">
                    <div className="sidebar-panel-title">
                      <Filter size={17} color="#38bdf8" /> Filters
                    </div>
                    {activeFiltersCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        style={{
                          fontSize: '0.78rem',
                          color: '#38bdf8',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Department Filter */}
                  <div style={{ marginBottom: '1.15rem' }}>
                    <label
                      htmlFor="filter-dept"
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Department
                    </label>
                    <div className="sidebar-select-wrap">
                      <GraduationCap
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-dim)',
                          pointerEvents: 'none',
                        }}
                      />
                      <select
                        id="filter-dept"
                        value={selectedDept}
                        onChange={(e) => {
                          setSelectedDept(e.target.value);
                          setPage(1);
                        }}
                        className="sidebar-select"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept === 'ALL' ? 'All Departments' : dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Year of Study Filter */}
                  <div style={{ marginBottom: '1.15rem' }}>
                    <label
                      htmlFor="filter-year"
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Year of Study
                    </label>
                    <div className="sidebar-select-wrap">
                      <Calendar
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-dim)',
                          pointerEvents: 'none',
                        }}
                      />
                      <select
                        id="filter-year"
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(e.target.value);
                          setPage(1);
                        }}
                        className="sidebar-select"
                      >
                        {GRADUATION_YEARS.map((y) => (
                          <option key={y.value} value={y.value}>
                            {y.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Online Status Toggle */}
                  <div className="sidebar-toggle-row">
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#fff' }}>
                        Online Status
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                        Show only online
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={onlyOnline}
                        onChange={(e) => handleToggleOnline(e.target.checked)}
                        aria-label="Toggle show only online students"
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* 2. Top Suggestions Card (matching reference design) */}
                {suggestions.length > 0 && (
                  <div className="sidebar-panel-card">
                    <div className="sidebar-panel-header" style={{ marginBottom: '0.85rem' }}>
                      <div className="sidebar-panel-title">
                        <span style={{ color: '#f59e0b' }}>⭐</span> Top Suggestions
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {suggestions.map((sug) => {
                        const isPending = actionLoadingMap[sug.id];
                        return (
                          <div key={sug.id} className="suggestion-item">
                            <div className="suggestion-left">
                              <a href={`/profile?userId=${sug.id}`} className="suggestion-avatar">
                                {sug.avatarUrl ? (
                                  <img
                                    src={sug.avatarUrl}
                                    alt={sug.displayName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  sug.displayName.charAt(0) || 'S'
                                )}
                              </a>
                              <div style={{ minWidth: 0 }}>
                                <a
                                  href={`/profile?userId=${sug.id}`}
                                  className="suggestion-name"
                                  title={sug.displayName}
                                  style={{ display: 'block' }}
                                >
                                  {sug.displayName}
                                </a>
                                <div className="suggestion-dept">{sug.department}</div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSendFriendRequest(sug.id)}
                              disabled={isPending}
                              className="btn-suggestion-add"
                            >
                              {isPending ? <Loader2 size={11} className="spinner" /> : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Grow Together! Callout Card */}
                <div className="grow-together-card">
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>🚀</div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: '0.25rem' }}>
                    Grow Together!
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1rem' }}>
                    Connect, share and build your DBU network.
                  </p>
                  <button
                    onClick={scrollToExplore}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      fontSize: '0.825rem',
                      padding: '0.55rem',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: '10px',
                    }}
                  >
                    Explore People →
                  </button>
                </div>
              </aside>

            </div>
          </div>
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
