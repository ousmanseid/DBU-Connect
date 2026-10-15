'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Eligibility check
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [rosterInfo, setRosterInfo] = useState<any>(null);

  // Step 2: Account completion
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCheckingEligibility(true);

    try {
      const res = await fetch('/api/auth/verify-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), studentId: studentId.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.eligible) {
        throw new Error(data.message || 'Institutional eligibility could not be verified.');
      }

      setRosterInfo(data);
      setDisplayName(data.fullName || '');
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Eligibility check failed');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          studentId: studentId.trim(),
          password,
          displayName: displayName.trim(),
          department: rosterInfo?.department,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating student account');
    } finally {
      setSubmitting(false);
    }
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
      <div style={{ maxWidth: '480px', width: '100%' }}>
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
            DBU Student <span style={{ color: 'var(--primary-gold)' }}>Registration</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Official Registrar Eligibility Verification & Account Activation
          </p>
        </div>

        <div className="card">
          {/* Step Indicators */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '0.875rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: step === 1 ? 'var(--primary-gold)' : 'var(--accent-emerald)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                1
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step === 1 ? '#fff' : 'var(--text-muted)' }}>
                Roster Verification
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: step === 2 ? 'var(--primary-gold)' : 'var(--bg-surface-elevated)',
                  color: step === 2 ? '#000' : 'var(--text-dim)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                2
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step === 2 ? '#fff' : 'var(--text-muted)' }}>
                Profile Setup
              </span>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleCheckEligibility}>
              <div className="form-group">
                <label className="form-label">Official University Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@dbu.edu.et"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institutional Student ID Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. DBU/15/0781"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)',
                  marginBottom: '1rem',
                }}
              >
                💡 <strong>Demo tip:</strong> To test new student verification, try eligible unclaimed demo record:{' '}
                <code style={{ color: 'var(--primary-gold)' }}>kalkidan.alemu@dbu.edu.et</code> with ID{' '}
                <code style={{ color: 'var(--primary-gold)' }}>DBU/15/0781</code>.
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

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={checkingEligibility}
              >
                {checkingEligibility ? (
                  <span className="loading-spinner" />
                ) : (
                  <>
                    <ShieldCheck size={16} /> Verify Student Eligibility
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompleteRegistration}>
              {/* Verified Badge */}
              <div
                style={{
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-emerald-light)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--accent-emerald)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem' }}>
                  <CheckCircle2 size={16} /> Student Record Verified!
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {rosterInfo?.department} • {rosterInfo?.faculty}
                </div>
              </div>

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
                <label className="form-label">Password (Min 8 Characters)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="loading-spinner" />
                  ) : (
                    <>
                      <Lock size={15} /> Complete & Enter Campus
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

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
            Already registered?{' '}
            <a href="/login" style={{ color: 'var(--primary-gold)', fontWeight: 600 }}>
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
