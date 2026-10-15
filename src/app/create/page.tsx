'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  FileText,
  Image as ImageIcon,
  Video,
  UploadCloud,
  X,
  Globe,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

type PostType = 'text' | 'image' | 'video';
type Visibility = 'CAMPUS' | 'FRIENDS_ONLY';

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('CAMPUS');

  // Media state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Status & Feedback state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [mediaPreviewUrl]);

  const handleTabChange = (type: PostType) => {
    setPostType(type);
    setErrorMessage(null);
    if (type === 'text') {
      setSelectedFile(null);
      if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
      setMediaPreviewUrl(null);
    }
  };

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);

    if (postType === 'image') {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedImageTypes.includes(file.type)) {
        setErrorMessage('Please select a valid image file (JPG, PNG, WebP, GIF).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Image size exceeds 10MB limit.');
        return;
      }
    } else if (postType === 'video') {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedVideoTypes.includes(file.type)) {
        setErrorMessage('Please select a valid video file (MP4, WebM, MOV).');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage('Video size exceeds 50MB limit.');
        return;
      }
    }

    if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveMedia = () => {
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setSelectedFile(null);
    setMediaPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!content.trim() && !selectedFile) {
      setErrorMessage('Please enter text content or select a media file to publish.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let finalMediaUrl: string | undefined = undefined;
      let finalMediaType: 'IMAGE' | 'VIDEO' | undefined = undefined;

      // 1. Upload media file if attached
      if (selectedFile) {
        setUploadProgress(25);
        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploadProgress(50);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || 'Media upload failed. Please try again.');
        }

        setUploadProgress(85);
        finalMediaUrl = uploadData.url;
        finalMediaType = uploadData.mediaType;
      }

      // 2. Create the post in database
      const postRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim() || (finalMediaType === 'VIDEO' ? 'Campus Video' : 'Campus Photo'),
          visibility,
          mediaUrl: finalMediaUrl,
          mediaType: finalMediaType,
        }),
      });

      const postData = await postRes.json();
      if (!postRes.ok) {
        throw new Error(postData.message || 'Failed to publish post.');
      }

      setUploadProgress(100);
      setSuccessMessage('Post published successfully to the DBU campus community!');

      // Redirect to Home after brief confirmation
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while publishing.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const isPublishDisabled =
    isSubmitting ||
    (!content.trim() && !selectedFile) ||
    (postType !== 'text' && !selectedFile && !content.trim());

  return (
    <div className="app-container">
      <Navigation />

      <main className="app-main">
        <Header title="Create Post" />

        <div className="app-content" style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => router.push('/')}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                title="Return to Home Feed"
              >
                <ArrowLeft size={16} /> Home
              </button>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  Create Campus Post
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Share academic updates, events, or student life across Debre Berhan University.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-rose-light)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fecdd3',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={18} color="var(--accent-rose)" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-emerald-light)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#a7f3d0',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              <CheckCircle size={18} color="var(--accent-emerald)" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Composer Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            {/* Format Selection Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                background: 'var(--bg-primary)',
                padding: '0.35rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => handleTabChange('text')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: postType === 'text' ? '#fff' : 'var(--text-muted)',
                  background: postType === 'text' ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: postType === 'text' ? '1px solid var(--border-light)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <FileText size={16} /> Text Post
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('image')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: postType === 'image' ? '#fff' : 'var(--text-muted)',
                  background: postType === 'image' ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: postType === 'image' ? '1px solid var(--border-light)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <ImageIcon size={16} /> Photo Post
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('video')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: postType === 'video' ? '#fff' : 'var(--text-muted)',
                  background: postType === 'video' ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: postType === 'video' ? '1px solid var(--border-light)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Video size={16} /> Video Post
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Text Caption Area */}
              <div style={{ marginBottom: '1.25rem' }}>
                <textarea
                  className="input-field"
                  rows={postType === 'text' ? 6 : 3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={3000}
                  placeholder={
                    postType === 'text'
                      ? "What's happening around Debre Berhan University? Share campus updates, lecture insights, questions, or notices..."
                      : postType === 'image'
                      ? 'Write a caption for this campus photo...'
                      : 'Write a caption for this university video...'
                  }
                  style={{ resize: 'vertical', width: '100%', fontSize: '0.95rem', lineHeight: '1.5' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {content.length} / 3000
                </div>
              </div>

              {/* Media Upload Area (for image or video mode) */}
              {postType !== 'text' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={postType === 'image' ? 'image/png, image/jpeg, image/webp, image/gif' : 'video/mp4, video/webm, video/quicktime'}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {/* Media Preview if Selected */}
                  {mediaPreviewUrl ? (
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        background: '#000',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      {postType === 'image' ? (
                        <img
                          src={mediaPreviewUrl}
                          alt="Post Preview"
                          style={{
                            width: '100%',
                            maxHeight: '420px',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <video
                          controls
                          playsInline
                          src={mediaPreviewUrl}
                          style={{
                            width: '100%',
                            maxHeight: '420px',
                            display: 'block',
                          }}
                        />
                      )}

                      {/* Remove & Change Overlay Buttons */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          display: 'flex',
                          gap: '0.5rem',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.65rem',
                            background: 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(6px)',
                          }}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveMedia}
                          style={{
                            background: 'rgba(244, 63, 94, 0.85)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Remove media"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* File Name Info Tag */}
                      {selectedFile && (
                        <div
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-surface-elevated)',
                            borderTop: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{selectedFile.name}</span>
                          <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Dropzone when no file selected */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: isDragging ? '2px dashed var(--accent-blue)' : '2px dashed var(--border-light)',
                        background: isDragging ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2.5rem 1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          background: 'var(--bg-surface-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 1rem auto',
                          color: 'var(--accent-blue)',
                        }}
                      >
                        <UploadCloud size={28} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff', marginBottom: '0.35rem' }}>
                        Click to select {postType === 'image' ? 'an image' : 'a video'} or drag and drop
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {postType === 'image'
                          ? 'JPG, PNG, WebP, GIF up to 10MB'
                          : 'MP4, WebM, MOV up to 50MB (plays directly in campus feed)'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Progress Bar */}
              {uploadProgress !== null && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <span>Uploading media file securely...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--primary-gold) 100%)',
                        transition: 'width 200ms ease-out',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Post Controls: Visibility & Actions */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                {/* Visibility Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Audience:</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => setVisibility('CAMPUS')}
                      className={`btn ${visibility === 'CAMPUS' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                    >
                      <Globe size={13} /> Campus
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('FRIENDS_ONLY')}
                      className={`btn ${visibility === 'FRIENDS_ONLY' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                    >
                      <Lock size={13} /> Friends Only
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isPublishDisabled}
                    style={{ fontSize: '0.85rem', minWidth: '120px' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={15} className="spinner" /> Publishing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} /> Publish Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
