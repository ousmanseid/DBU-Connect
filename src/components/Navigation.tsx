'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  Plus,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  User,
  Shield,
  LogOut,
  LogIn,
  GraduationCap,
  Rocket,
  ArrowRight,
} from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    department?: string;
  };
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.unreadCount !== undefined) {
          setUnreadNotifications(data.unreadCount);
        }
      })
      .catch(() => {});

    fetch('/api/messages/conversations')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.conversations) {
          const totalUnread = data.conversations.reduce(
            (acc: number, c: any) => acc + (c.unreadCount || 0),
            0
          );
          setUnreadMessages(totalUnread);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    router.push('/login');
    router.refresh();
  };

  // Main navigation ordering matching reference design
  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/students', label: 'Discover People', icon: Users },
    { href: '/create', label: 'Create', icon: Plus, isButton: true },
    {
      href: '/inbox',
      label: 'Inbox',
      icon: MessageSquare,
      badge: unreadMessages + unreadNotifications > 0 ? unreadMessages + unreadNotifications : undefined,
    },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { href: '/menilik', label: 'Menilik AI', icon: Sparkles, accent: true },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const isStaff =
    currentUser &&
    (currentUser.role === 'ADMIN' ||
      currentUser.role === 'REGISTRAR' ||
      currentUser.role === 'SUPER_ADMIN');

  if (isStaff) {
    navLinks.push({
      href: '/admin',
      label: 'Admin Desk',
      icon: Shield,
    });
  }

  // Mobile bottom navigation (5 primary items)
  const mobileNavLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/students', label: 'Discover', icon: Users },
    { href: '/create', label: 'Create', icon: Plus, isPrimary: true },
    {
      href: '/inbox',
      label: 'Inbox',
      icon: MessageSquare,
      badge: unreadMessages + unreadNotifications > 0 ? unreadMessages + unreadNotifications : undefined,
    },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="app-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'space-between' }}>
        <div>
          {/* Logo Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
              }}
            >
              <GraduationCap size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#fff' }}>
                DBU <span style={{ color: '#38bdf8' }}>Connect</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                Connect • Share • Grow
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              if (link.isButton) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.925rem',
                      fontWeight: 700,
                      color: '#fff',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                      marginTop: '0.25rem',
                      marginBottom: '0.25rem',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={16} color="#fff" />
                    </div>
                    <span>{link.label}</span>
                  </a>
                );
              }

              return (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : link.accent ? 'var(--primary-gold)' : 'var(--text-muted)',
                    background: isActive ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'transparent',
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon
                      size={18}
                      color={
                        isActive
                          ? '#ffffff'
                          : link.accent
                          ? 'var(--primary-gold)'
                          : 'currentColor'
                      }
                    />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--accent-rose)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Callout Widget & User Profile */}
        <div>
          {/* Expand Your DBU Network Callout Card (matching reference design) */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.65rem auto',
              }}
            >
              <Users size={20} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', marginBottom: '0.35rem' }}>
              Expand Your DBU Network!
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '0.875rem' }}>
              Connect with amazing students, make friends and grow together.
            </p>
            <a
              href="/students"
              className="btn btn-primary"
              style={{
                width: '100%',
                fontSize: '0.8rem',
                padding: '0.5rem',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              Explore Now →
            </a>
          </div>

          {/* User Profile Mini Bar */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a
                  href="/profile"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-blue) 0%, #2563eb 100%)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff',
                      fontSize: '0.9rem',
                      flexShrink: 0,
                    }}
                  >
                    {currentUser.profile?.displayName?.[0] || 'U'}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentUser.profile?.displayName || 'Student'}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      DBU Student
                    </div>
                  </div>
                </a>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  style={{
                    color: 'var(--text-muted)',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href="/login" className="btn btn-primary" style={{ width: '100%', fontSize: '0.825rem' }}>
                  <LogIn size={15} /> Sign In
                </a>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav">
        {mobileNavLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          if (link.isPrimary) {
            return (
              <a
                key={link.href}
                href={link.href}
                aria-label="Create Post"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  transform: 'translateY(-10px)',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                <Plus size={22} color="#fff" />
              </a>
            );
          }

          return (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                color: isActive ? '#38bdf8' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: isActive ? 600 : 500,
                position: 'relative',
              }}
            >
              <Icon size={20} />
              <span>{link.label}</span>
              {link.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '6px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent-rose)',
                  }}
                />
              )}
            </a>
          );
        })}
      </nav>
    </>
  );
}
