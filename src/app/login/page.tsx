'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  LogIn,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Student A (CS Major)', email: 'abebe.kebede@dbu.edu.et', name: 'Abebe Kebede' },
  { role: 'Student B (SE Major)', email: 'bethlehem.haile@dbu.edu.et', name: 'Bethlehem Haile' },
  { role: 'Registrar Officer', email: 'registrar@dbu.edu.et', name: 'Almaz Tessema' },
  { role: 'Campus Admin', email: 'admin@dbu.edu.et', name: 'Mulugeta Assefa' },
  { role: 'Super Administrator', email: 'superadmin@dbu.edu.et', name: 'Dr. Girma Worku' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPassword || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DBUConnect2026!');
    handleLogin(undefined, demoEmail, 'DBUConnect2026!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary-gold) 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: 'var(--shadow-gold-glow)',
            }}
          >
            <GraduationCap size={32} color="#000" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            DBU <span style={{ color: 'var(--primary-gold)' }}>Connect</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Debre Berhan University Social & Campus Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
            Sign In to Your Account
          </h2>

          <form onSubmit={(e) => handleLogin(e)}>
            <div className="form-group">
              <label className="form-label">University Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="student.name@dbu.edu.et"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {errorMsg && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.65rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-rose-light)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <span className="loading-spinner" /> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            New DBU student?{' '}
            <a href="/register" style={{ color: 'var(--primary-gold)', fontWeight: 600 }}>
              Verify Roster & Register
            </a>
          </div>
        </div>

        {/* Quick One-Click Demo Role Switcher */}
        <div
          className="card"
          style={{
            borderColor: 'rgba(245, 158, 11, 0.25)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(13, 22, 40, 0.9) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={16} color="var(--primary-gold)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-gold)', textTransform: 'uppercase' }}>
              One-Click Evaluation Switcher
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
            Click any seeded synthetic account below to immediately sign in and evaluate that role:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {DEMO_ACCOUNTS.map((acc, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickDemoLogin(acc.email)}
                disabled={loading}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <strong style={{ color: '#fff' }}>{acc.name}</strong> ({acc.role})
                </div>
                <span style={{ color: 'var(--accent-blue)', fontSize: '0.7rem' }}>Sign In →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
