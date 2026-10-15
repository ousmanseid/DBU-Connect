'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  Clock,
  CheckCheck,
  Users,
  Bell,
  Check,
  X,
  UserCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface ConversationItem {
  id: string;
  updatedAt: string;
  unreadCount: number;
  otherMember: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    department: string;
  } | null;
  latestMessage?: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    senderName: string;
  } | null;
}

interface MessageItem {
  id: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
  sender: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

interface FriendRequestItem {
  id: string;
  createdAt: string;
  senderId?: string;
  receiverId?: string;
  sender?: {
    displayName: string;
    avatarUrl: string | null;
    department: string;
  };
  receiver?: {
    displayName: string;
    avatarUrl: string | null;
    department: string;
  };
}

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function InboxContent() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');
  const initialTab = (searchParams.get('tab') as 'messages' | 'requests' | 'notifications') || 'messages';

  const [activeTab, setActiveTab] = useState<'messages' | 'requests' | 'notifications'>(initialTab);

  // Messaging State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [convLoading, setConvLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Friend Requests State
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestItem[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Status Notice
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      setConvLoading(true);
      const res = await fetch('/api/messages/conversations');
      const data = await res.json();
      if (data?.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !selectedConvId && !targetUserId) {
          selectConversation(data.conversations[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConvLoading(false);
    }
  };

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch('/api/friends');
      const data = await res.json();
      if (res.ok) {
        setReceivedRequests(data.receivedRequests || []);
        setSentRequests(data.sentRequests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchFriendRequests();
    fetchNotifications();
  }, []);

  // Handle direct message initiation from profile or marketplace
  useEffect(() => {
    if (targetUserId) {
      setActiveTab('messages');
      fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: targetUserId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.conversationId) {
            setSelectedConvId(data.conversationId);
            loadMessages(data.conversationId);
            fetchConversations();
          }
        })
        .catch(console.error);
    }
  }, [targetUserId]);

  const selectConversation = (conv: ConversationItem) => {
    setSelectedConvId(conv.id);
    setSelectedPartner(conv.otherMember);
    loadMessages(conv.id);
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/messages/conversations/${convId}`);
      const data = await res.json();
      if (data?.messages) {
        setMessages(data.messages);
        if (data.conversation?.otherMember) {
          setSelectedPartner(data.conversation.otherMember);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;

    try {
      setSending(true);
      const res = await fetch(`/api/messages/conversations/${selectedConvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessageInput('');
        setMessages((prev) => [...prev, data.message]);
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Friend Request Actions
  const handleAcceptRequest = async (requestId: string) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [requestId]: true }));
      const res = await fetch(`/api/friends/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT' }),
      });

      if (res.ok) {
        setFeedback({ type: 'success', text: 'Friend request accepted! You are now connected.' });
        setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        const data = await res.json();
        setFeedback({ type: 'error', text: data.message || 'Failed to accept request.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [requestId]: false }));
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [requestId]: true }));
      const res = await fetch(`/api/friends/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DECLINE' }),
      });

      if (res.ok) {
        setFeedback({ type: 'success', text: 'Friend request declined.' });
        setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [requestId]: false }));
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleCancelSentRequest = async (requestId: string) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [requestId]: true }));
      const res = await fetch(`/api/friends/${requestId}`, { method: 'DELETE' });

      if (res.ok) {
        setFeedback({ type: 'success', text: 'Outgoing request cancelled.' });
        setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [requestId]: false }));
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    await fetch('/api/notifications', { method: 'PUT' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setFeedback({ type: 'success', text: 'All notifications marked as read.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Campus Inbox & Connections" />

        <div className="app-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 84px)' }}>
          {/* Top Tabs Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('messages')}
                className={`btn ${activeTab === 'messages' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <MessageSquare size={16} /> Messages
                {totalUnreadMessages > 0 && (
                  <span className="badge badge-rose" style={{ padding: '0.1rem 0.45rem', fontSize: '0.65rem' }}>
                    {totalUnreadMessages}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Users size={16} /> Friend Requests
                {receivedRequests.length > 0 && (
                  <span className="badge badge-gold" style={{ padding: '0.1rem 0.45rem', fontSize: '0.65rem' }}>
                    {receivedRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Bell size={16} /> Activity & Alerts
                {unreadNotifsCount > 0 && (
                  <span className="badge badge-rose" style={{ padding: '0.1rem 0.45rem', fontSize: '0.65rem' }}>
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'notifications' && unreadNotifsCount > 0 && (
              <button
                onClick={handleMarkAllNotificationsRead}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background:
                  feedback.type === 'success' ? 'var(--accent-emerald-light)' : 'var(--accent-rose-light)',
                color: feedback.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                border: `1px solid ${
                  feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'
                }`,
              }}
            >
              {feedback.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
              {feedback.text}
            </div>
          )}

          {/* TAB 1: DIRECT MESSAGES */}
          {activeTab === 'messages' && (
            <div style={{ display: 'flex', gap: '1.25rem', flex: 1, minHeight: 0 }}>
              {/* Left: Conversations List */}
              <div
                className="card"
                style={{
                  width: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1rem',
                  overflowY: 'auto',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: '1rem' }}>
                  Conversations
                </div>

                {convLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <span className="loading-spinner" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.825rem' }}>
                    No active conversations yet. Find classmates in the{' '}
                    <a href="/students" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
                      student directory
                    </a>{' '}
                    to connect!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {conversations.map((conv) => {
                      const isSelected = selectedConvId === conv.id;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => selectConversation(conv)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                            border: isSelected ? '1px solid var(--border-light)' : '1px solid transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background var(--transition-fast)',
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: 'var(--accent-blue)',
                              flexShrink: 0,
                            }}
                          >
                            {conv.otherMember?.displayName?.[0] || 'U'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  color: '#fff',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {conv.otherMember?.displayName || 'DBU Student'}
                              </span>
                              {conv.unreadCount > 0 && (
                                <span className="badge badge-rose" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-dim)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {conv.latestMessage?.content || 'No messages yet'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Message Window */}
              <div
                className="card"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.25rem',
                  overflow: 'hidden',
                }}
              >
                {selectedConvId ? (
                  <>
                    {/* Chat Partner Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '0.875rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--primary-gold)',
                          }}
                        >
                          {selectedPartner?.displayName?.[0] || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                            {selectedPartner?.displayName || 'DBU Student'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {selectedPartner?.department || 'Debre Berhan University'}
                          </div>
                        </div>
                      </div>

                      {selectedPartner && (
                        <a
                          href={`/profile?userId=${selectedPartner.id}`}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                        >
                          View Profile
                        </a>
                      )}
                    </div>

                    {/* Messages Scroll Area */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        paddingRight: '0.5rem',
                        marginBottom: '1rem',
                      }}
                    >
                      {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                          Start your academic conversation with {selectedPartner?.displayName || 'this student'}.
                        </div>
                      ) : (
                        messages.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: m.isOwn ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '75%',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: '0.875rem',
                                lineHeight: '1.45',
                                background: m.isOwn
                                  ? 'linear-gradient(135deg, var(--accent-blue) 0%, #2563eb 100%)'
                                  : 'var(--bg-secondary)',
                                color: m.isOwn ? '#fff' : 'var(--text-main)',
                                border: m.isOwn ? 'none' : '1px solid var(--border-subtle)',
                              }}
                            >
                              {m.content}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Composer Input Bar */}
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Type a direct message to student..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!messageInput.trim() || sending}
                        style={{ minWidth: '90px' }}
                      >
                        {sending ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-dim)' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 0.75rem auto', color: 'var(--border-light)' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>No Conversation Selected</div>
                    <p style={{ fontSize: '0.825rem', maxWidth: '300px', marginTop: '0.25rem' }}>
                      Pick a conversation from the left drawer or message a classmate directly from their profile.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FRIEND REQUESTS */}
          {activeTab === 'requests' && (
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {/* Incoming Friend Requests Section */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                    Incoming Connection Requests ({receivedRequests.length})
                  </h3>
                </div>

                {requestsLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <span className="loading-spinner" />
                  </div>
                ) : receivedRequests.length === 0 ? (
                  <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <Users size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--text-dim)' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>No Incoming Requests</div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      You have no pending requests right now. Discover students across DBU to expand your network!
                    </p>
                    <a href="/students" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                      Discover Students <ArrowRight size={14} />
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {receivedRequests.map((req) => {
                      const isPending = actionLoadingMap[req.id];
                      return (
                        <div key={req.id} className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-blue) 0%, #2563eb 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                color: '#fff',
                                flexShrink: 0,
                              }}
                            >
                              {req.sender?.displayName?.[0] || 'U'}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                                {req.sender?.displayName || 'DBU Student'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                {req.sender?.department || 'Debre Berhan University'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Sent {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              disabled={isPending}
                              className="btn btn-primary"
                              style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}
                            >
                              {isPending ? <Loader2 size={14} className="spinner" /> : <Check size={14} />}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(req.id)}
                              disabled={isPending}
                              className="btn btn-secondary"
                              style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}
                            >
                              <X size={14} /> Decline
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Outgoing Friend Requests Section */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                  Sent Requests ({sentRequests.length})
                </h3>

                {sentRequests.length === 0 ? (
                  <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No pending sent requests.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {sentRequests.map((req) => {
                      const isPending = actionLoadingMap[req.id];
                      return (
                        <div key={req.id} className="card" style={{ padding: '1rem', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                                {req.receiver?.displayName || 'DBU Student'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                {req.receiver?.department || 'Debre Berhan University'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Sent {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCancelSentRequest(req.id)}
                              disabled={isPending}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                            >
                              Cancel Request
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                {notifLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <span className="loading-spinner" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                    <Bell size={36} style={{ margin: '0 auto 1rem auto', color: 'var(--text-dim)' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>No Activity Notifications</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      When fellow students interact with your posts, listings, or connection requests, notifications will appear here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="card"
                        style={{
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          background: n.read ? 'transparent' : 'var(--bg-surface-elevated)',
                          borderColor: n.read ? 'var(--border-subtle)' : 'var(--border-light)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'var(--bg-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--primary-gold)',
                            }}
                          >
                            <Bell size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.875rem', color: n.read ? 'var(--text-secondary)' : '#fff', fontWeight: n.read ? 400 : 600 }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                              {new Date(n.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        {!n.read && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'var(--primary-gold)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="loading-spinner" />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
