'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  User,
  Shield,
  LogOut,
  LogIn,
  Bell,
  Menu,
  X,
  GraduationCap,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { href: '/', label: 'Campus Feed', icon: Home },
    {
      href: '/inbox',
      label: 'Inbox',
      icon: MessageSquare,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
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

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="app-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-gold) 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-gold-glow)',
            }}
          >
            <GraduationCap size={22} color="#000" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em', color: '#fff' }}>
              DBU <span style={{ color: 'var(--primary-gold)' }}>Connect</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Debre Berhan University
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : link.accent ? 'var(--primary-gold)' : 'var(--text-muted)',
                  background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: isActive ? '1px solid var(--border-light)' : '1px solid transparent',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={link.accent ? 'var(--primary-gold)' : 'currentColor'} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="badge badge-gold" style={{ padding: '0.15rem 0.5rem' }}>
                    {link.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* User Mini Profile or Login Callout */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'var(--accent-blue)',
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {currentUser.profile?.displayName?.[0] || 'U'}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentUser.profile?.displayName || 'Student'}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                    {currentUser.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
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
              <a href="/register" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.825rem' }}>
                Register Profile
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav">
        {navLinks.slice(0, 5).map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                color: isActive ? 'var(--primary-gold)' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: isActive ? 600 : 500,
                position: 'relative',
              }}
            >
              <Icon size={20} />
              <span>{link.label.split(' ')[0]}</span>
              {link.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '4px',
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
