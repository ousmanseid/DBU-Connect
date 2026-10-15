'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  Shield,
  Users,
  FileSpreadsheet,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Upload,
  UserCheck,
  UserX,
  Search,
} from 'lucide-react';

export default function AdminDeskPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'roster' | 'users' | 'reports' | 'audit'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [rosterRecords, setRosterRecords] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Roster Import State
  const [batchJson, setBatchJson] = useState(
    JSON.stringify(
      [
        {
          studentId: 'DBU/17/0111',
          universityEmail: 'tewodros.kassa@dbu.edu.et',
          fullName: 'Tewodros Kassa',
          department: 'Software Engineering',
          faculty: 'Informatics',
          admissionYear: 2025,
          eligibilityStatus: 'ELIGIBLE',
        },
        {
          studentId: 'DBU/17/0222',
          universityEmail: 'hiwot.mekonnen@dbu.edu.et',
          fullName: 'Hiwot Mekonnen',
          department: 'Computer Science',
          faculty: 'Informatics',
          admissionYear: 2025,
          eligibilityStatus: 'ELIGIBLE',
        },
      ],
      null,
      2
    )
  );
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Access restricted');
      }
      setStats(data.stats);
      setAuditLogs(data.recentAuditLogs || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Administrative access required.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoster = async () => {
    try {
      const res = await fetch('/api/admin/roster');
      const data = await res.json();
      if (data?.records) setRosterRecords(data.records);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data?.users) setUsersList(data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data?.reports) setReportsList(data.reports);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (data?.auditLogs) setAuditLogs(data.auditLogs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'roster') fetchRoster();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const handleBatchImport = async () => {
    try {
      setImporting(true);
      setImportResult(null);
      const parsed = JSON.parse(batchJson);

      const res = await fetch('/api/admin/roster/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      setImportResult(data);
      fetchRoster();
    } catch (err: any) {
      setImportResult({ error: true, message: err.message || 'Invalid JSON format' });
    } finally {
      setImporting(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Administrative & Registrar Desk" />

        <div className="app-content">
          {errorMsg ? (
            <div className="card empty-state">
              <Shield className="empty-state-icon" style={{ color: 'var(--accent-rose)' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>Access Restricted</div>
              <div style={{ fontSize: '0.875rem', maxWidth: '420px', color: 'var(--text-muted)' }}>
                {errorMsg}
              </div>
              <a href="/login" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                Sign In with Administrative Role
              </a>
            </div>
          ) : (
            <>
              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
                <button
                  className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <Shield size={16} /> Overview KPIs
                </button>
                <button
                  className={`btn ${activeTab === 'roster' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('roster')}
                >
                  <FileSpreadsheet size={16} /> Registrar Roster Import
                </button>
                <button
                  className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('users')}
                >
                  <Users size={16} /> User Management
                </button>
                <button
                  className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('reports')}
                >
                  <AlertTriangle size={16} /> Moderation Queue
                </button>
                <button
                  className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('audit')}
                >
                  <History size={16} /> Audit Trail
                </button>
              </div>

              {/* TAB 1: OVERVIEW KPIS */}
              {activeTab === 'stats' && stats && (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div className="card">
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Total Registered Users
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
                        {stats.totalUsers}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                        Active Campus Accounts
                      </div>
                    </div>

                    <div className="card">
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Official Roster Records
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-gold)', marginTop: '0.35rem' }}>
                        {stats.totalRoster}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                        {stats.claimedRoster} claimed ({stats.activeRate}%)
                      </div>
                    </div>

                    <div className="card">
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Active Campus Posts
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '0.35rem' }}>
                        {stats.totalPosts}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                        Published discussions
                      </div>
                    </div>

                    <div className="card">
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Pending Reports
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.35rem' }}>
                        {stats.pendingReports}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                        Requiring moderator action
                      </div>
                    </div>
                  </div>

                  {/* Recent Audit Activity Table */}
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                      Recent Administrative Events
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {auditLogs.slice(0, 5).map((log) => (
                        <div
                          key={log.id}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <span className="badge badge-blue" style={{ fontSize: '0.65rem', marginRight: '0.5rem' }}>
                              {log.action}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                              by {log.actor?.email}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ROSTER & BATCH IMPORT */}
              {activeTab === 'roster' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                      Batch Student Roster Import (Registrar Tool)
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Import new academic admissions or update existing student eligibility records. Records are
                      reconciled atomically and missing students are never automatically disabled.
                    </p>

                    <textarea
                      className="form-control"
                      rows={6}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '1rem' }}
                      value={batchJson}
                      onChange={(e) => setBatchJson(e.target.value)}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button className="btn btn-primary" onClick={handleBatchImport} disabled={importing}>
                        <Upload size={16} /> {importing ? 'Processing Reconciliation...' : 'Reconcile Roster Records'}
                      </button>
                    </div>

                    {importResult && (
                      <div
                        style={{
                          marginTop: '1rem',
                          padding: '0.875rem',
                          borderRadius: 'var(--radius-md)',
                          background: importResult.error ? 'var(--accent-rose-light)' : 'var(--accent-emerald-light)',
                          color: importResult.error ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {importResult.error ? (
                          importResult.message
                        ) : (
                          <div>
                            <strong>Batch Import Complete ({importResult.batchId})</strong>
                            <div>
                              Processed: {importResult.summary.totalSubmitted} | Inserted:{' '}
                              {importResult.summary.insertedCount} | Updated: {importResult.summary.updatedCount} |
                              Errors: {importResult.summary.errorCount}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Roster Table */}
                  <div className="card" style={{ overflowX: 'auto' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                      Official Registrar Eligibility Roster ({rosterRecords.length})
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                          <th style={{ padding: '0.65rem' }}>Student ID</th>
                          <th style={{ padding: '0.65rem' }}>Full Name</th>
                          <th style={{ padding: '0.65rem' }}>University Email</th>
                          <th style={{ padding: '0.65rem' }}>Department</th>
                          <th style={{ padding: '0.65rem' }}>Status</th>
                          <th style={{ padding: '0.65rem' }}>Claimed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rosterRecords.map((r) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.65rem', fontWeight: 600, color: 'var(--accent-blue)' }}>{r.studentId}</td>
                            <td style={{ padding: '0.65rem', color: '#fff' }}>{r.fullName}</td>
                            <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>{r.universityEmail}</td>
                            <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{r.department}</td>
                            <td style={{ padding: '0.65rem' }}>
                              <span className={`badge ${r.eligibilityStatus === 'ELIGIBLE' ? 'badge-emerald' : 'badge-gold'}`}>
                                {r.eligibilityStatus}
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem' }}>
                              {r.claimed ? (
                                <span className="badge badge-blue">Claimed</span>
                              ) : (
                                <span className="badge badge-gold">Unclaimed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: USERS & STATUS */}
              {activeTab === 'users' && (
                <div className="card" style={{ overflowX: 'auto' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                    Registered Platform Users ({usersList.length})
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                        <th style={{ padding: '0.65rem' }}>User Email</th>
                        <th style={{ padding: '0.65rem' }}>Display Name</th>
                        <th style={{ padding: '0.65rem' }}>Role</th>
                        <th style={{ padding: '0.65rem' }}>Account Status</th>
                        <th style={{ padding: '0.65rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.65rem', fontWeight: 600, color: '#fff' }}>{u.email}</td>
                          <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>
                            {u.profile?.displayName || 'Student'}
                          </td>
                          <td style={{ padding: '0.65rem' }}>
                            <span className="badge badge-gold">{u.role}</span>
                          </td>
                          <td style={{ padding: '0.65rem' }}>
                            <span className={`badge ${u.status === 'ACTIVE' ? 'badge-emerald' : 'badge-rose'}`}>
                              {u.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem' }}>
                            {u.role !== 'SUPER_ADMIN' && (
                              <button
                                className={`btn ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'}`}
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                onClick={() => handleToggleUserStatus(u.id, u.status)}
                              >
                                {u.status === 'ACTIVE' ? <UserX size={13} /> : <UserCheck size={13} />}
                                {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: MODERATION QUEUE */}
              {activeTab === 'reports' && (
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                    Content Moderation Reports ({reportsList.length})
                  </h3>
                  {reportsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-dim)' }}>
                      No reports currently in moderation queue.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {reportsList.map((rep) => (
                        <div
                          key={rep.id}
                          style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="badge badge-rose">{rep.reason}</span>
                            <span className="badge badge-gold">{rep.status}</span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#fff', marginBottom: '0.35rem' }}>
                            Target Type: <strong>{rep.targetType}</strong> (ID: {rep.targetId})
                          </div>
                          {rep.details && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                              Reporter Note: "{rep.details}"
                            </div>
                          )}
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                            Reported by: {rep.reporter?.email} on {new Date(rep.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: AUDIT LOGS */}
              {activeTab === 'audit' && (
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                    Full Platform Audit Trail
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span className="badge badge-blue">{log.action}</span>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Actor: <strong>{log.actor?.email}</strong> ({log.actor?.role})
                        </div>
                        {log.details && (
                          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
