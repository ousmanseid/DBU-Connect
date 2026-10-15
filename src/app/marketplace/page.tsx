'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  ShoppingBag,
  Search,
  Plus,
  Bookmark,
  MessageCircle,
  MapPin,
  Tag,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { marketplaceCategories, marketplaceConditions } from '@/lib/validation';

interface ListingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  condition: string;
  status: string;
  imageUrl?: string | null;
  location: string;
  createdAt: string;
  isSaved: boolean;
  seller: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    department: string;
    contactEmail: string;
    phone?: string | null;
  };
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Listing Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(marketplaceCategories[0]);
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<string>(marketplaceConditions[0]);
  const [location, setLocation] = useState('Main Campus');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/marketplace/listings?${params.toString()}`);
      const data = await res.json();
      if (data?.listings) {
        setListings(data.listings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleToggleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/marketplace/listings/${id}/save`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setListings((prev) =>
          prev.map((l) => (l.id === id ? { ...l, isSaved: data.isSaved } : l))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          price: parseFloat(price),
          condition,
          location,
          imageUrl: imageUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create listing');
      }

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      fetchListings();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error creating listing.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Campus Marketplace" />

        <div className="app-content">
          {/* Header Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                DBU Student Marketplace
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Peer-to-peer campus exchange for textbooks, dorm essentials, and electronics.
              </p>
            </div>

            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Post New Listing
            </button>
          </div>

          {/* Search & Category Filter Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
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
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search textbook title, calculator, desk lamp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </form>

            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              <button
                className={`btn ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                onClick={() => setSelectedCategory('')}
              >
                All Items
              </button>
              {marketplaceCategories.map((cat) => (
                <button
                  key={cat}
                  className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
              <div style={{ marginTop: '0.75rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Fetching verified campus listings...
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="card empty-state">
              <ShoppingBag className="empty-state-icon" />
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
                No listings found
              </div>
              <div style={{ fontSize: '0.85rem', maxWidth: '380px' }}>
                {selectedCategory
                  ? `No items currently listed in the '${selectedCategory}' category.`
                  : 'Be the first student to publish an item in the DBU marketplace!'}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Category & Save Button */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                        {item.category}
                      </span>
                      <button
                        onClick={() => handleToggleSave(item.id)}
                        style={{
                          color: item.isSaved ? 'var(--primary-gold)' : 'var(--text-dim)',
                          padding: '0.25rem',
                        }}
                        title={item.isSaved ? 'Saved to bookmarks' : 'Save listing'}
                      >
                        <Bookmark size={18} fill={item.isSaved ? 'var(--primary-gold)' : 'none'} />
                      </button>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                      {item.title}
                    </h3>

                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--primary-gold)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {item.price} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ETB</span>
                    </div>

                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.45',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {item.description}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        marginBottom: '1rem',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Tag size={13} /> {item.condition}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={13} /> {item.location}
                      </span>
                    </div>
                  </div>

                  {/* Seller Footer */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {item.seller.displayName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {item.seller.department}
                      </div>
                    </div>

                    <a
                      href={`/inbox?user=${item.seller.id}`}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                    >
                      <MessageCircle size={14} /> Contact
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Listing Modal */}
          {isModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                zIndex: 100,
              }}
            >
              <div className="card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Post Marketplace Item</h3>
                  <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-dim)' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateListing}>
                  <div className="form-group">
                    <label className="form-label">Item Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Engineering Mathematics Textbook 4th Ed"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {marketplaceCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Price (ETB)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="350"
                        min="1"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Condition</label>
                      <select
                        className="form-control"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                      >
                        {marketplaceConditions.map((cond) => (
                          <option key={cond} value={cond}>
                            {cond}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Campus Handover Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Main Campus, Library, or Dorm Block 12"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description & Details</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Describe the item condition, edition, why you are selling, etc."
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {feedback && (
                    <div
                      style={{
                        marginBottom: '1rem',
                        padding: '0.65rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-rose-light)',
                        color: 'var(--accent-rose)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {feedback.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? <span className="loading-spinner" /> : 'Publish Listing'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
