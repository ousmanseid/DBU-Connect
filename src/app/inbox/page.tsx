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

function InboxContent() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle direct message initiation from profile or marketplace
  useEffect(() => {
    if (targetUserId) {
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

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Direct Messages & Campus Inbox" />

        <div className="app-content" style={{ display: 'flex', gap: '1.25rem', height: 'calc(100vh - 84px)' }}>
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

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <span className="loading-spinner" />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.825rem' }}>
                No active conversations yet. Reach out to a peer from the campus feed or marketplace!
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
                    gap: '0.75rem',
                    paddingBottom: '0.875rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '1rem',
                  }}
                >
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
                      Start your conversation with {selectedPartner?.displayName || 'this student'}.
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

                {/* Composer */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    disabled={sending}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sending || !messageInput.trim()}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-dim)',
                  gap: '0.75rem',
                }}
              >
                <MessageSquare size={48} />
                <div style={{ fontWeight: 600 }}>Select a conversation to start messaging</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <span className="loading-spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
