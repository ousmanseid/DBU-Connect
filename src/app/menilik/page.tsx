'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  Sparkles,
  Send,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface Citation {
  documentTitle: string;
  section: string;
  category: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'menilik';
  text: string;
  isGrounded?: boolean;
  citations?: Citation[];
  suggestedQuestions?: string[];
  disclaimer?: string;
  timestamp: string;
}

const SAMPLE_PROMPTS = [
  'What is the minimum GPA scale and academic warning threshold?',
  'What are the night curfew hours for campus dormitories?',
  'How do I request my official graduation transcript and clearance?',
  'What is the penalty for cheating or academic misconduct?',
  'How many books can undergraduate students borrow from the library?',
];

export default function MenilikAIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'menilik',
      text:
        'Hello! I am Menilik, your Debre Berhan University information assistant. I provide answers strictly grounded in official DBU senate legislation, student handbooks, and registrar regulations.\n\nHow can I help you today?',
      isGrounded: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendQuestion = async (queryText?: string) => {
    const question = (queryText || inputQuery).trim();
    if (!question || loading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/menilik/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to query Menilik AI');
      }

      const botMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'menilik',
        text: data.answer,
        isGrounded: data.isGrounded,
        citations: data.citations,
        suggestedQuestions: data.suggestedQuestions,
        disclaimer: data.disclaimer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'menilik',
          text:
            'You must be signed in to access Menilik AI. Please log in with your DBU student account.',
          isGrounded: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Menilik AI — University Information Assistant" />

        <div className="app-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
          {/* Top Banner */}
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(13, 22, 40, 0.8) 100%)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  Approved University Knowledge RAG
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Grounded in official Debre Berhan University Senate legislation & handbook policies.
                </div>
              </div>
            </div>
            <span className="badge badge-gold">
              <ShieldCheck size={12} /> DBU Approved
            </span>
          </div>

          {/* Chat Transcript Container */}
          <div
            className="card"
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '1rem',
              padding: '1.25rem',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '0.875rem 1.15rem',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    background:
                      m.sender === 'user'
                        ? 'linear-gradient(135deg, var(--accent-blue) 0%, #2563eb 100%)'
                        : 'var(--bg-secondary)',
                    color: m.sender === 'user' ? '#fff' : 'var(--text-main)',
                    border:
                      m.sender === 'user'
                        ? 'none'
                        : '1px solid var(--border-subtle)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}

                  {/* Grounded Citations Box */}
                  {m.citations && m.citations.length > 0 && (
                    <div
                      style={{
                        marginTop: '0.875rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: 'var(--primary-gold)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          marginBottom: '0.4rem',
                        }}
                      >
                        <BookOpen size={13} /> Official Policy Citations:
                      </div>
                      {m.citations.map((c, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--bg-surface-elevated)',
                            padding: '0.4rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '0.3rem',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#fff' }}>{c.documentTitle}</span>
                          <div style={{ color: 'var(--accent-blue)' }}>{c.section}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Alternatives when ungrounded */}
                  {m.suggestedQuestions && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                        Try asking one of these verified questions:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {m.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendQuestion(q)}
                            style={{
                              textAlign: 'left',
                              color: 'var(--primary-gold)',
                              textDecoration: 'underline',
                              fontSize: '0.78rem',
                            }}
                          >
                            • {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: '0.4rem',
                      fontSize: '0.65rem',
                      color: m.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-dim)',
                      textAlign: 'right',
                    }}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <span className="loading-spinner" /> Searching official DBU legislation & handbooks...
              </div>
            )}
          </div>

          {/* Sample Prompts Tray */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '0.75rem', paddingBottom: '0.25rem' }}>
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
                onClick={() => handleSendQuestion(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Question Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion();
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Ask a question about DBU academic rules, dorms, grading, or clearance..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !inputQuery.trim()}
            >
              <Send size={16} /> Ask Menilik
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
