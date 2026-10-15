import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/upload/route';
import * as auth from '@/lib/auth';

describe('Media File Upload Endpoint Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated upload requests with 401', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(null);

    const formData = new FormData();
    const blob = new Blob(['sample data'], { type: 'image/png' });
    formData.append('file', blob, 'test.png');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('rejects request with missing file with 400', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({
      id: 'mock-student-id',
      email: 'student@dbu.edu.et',
      role: 'STUDENT',
      status: 'ACTIVE',
    } as any);

    const formData = new FormData();
    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('NO_FILE');
  });

  it('rejects unsupported file formats with 415', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({
      id: 'mock-student-id',
      email: 'student@dbu.edu.et',
      role: 'STUDENT',
      status: 'ACTIVE',
    } as any);

    const formData = new FormData();
    const blob = new Blob(['fake executable code'], { type: 'application/x-msdownload' });
    formData.append('file', blob, 'malware.exe');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(415);
    expect(data.error).toBe('UNSUPPORTED_TYPE');
  });

  it('rejects file when magic bytes do not match MIME type', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({
      id: 'mock-student-id',
      email: 'student@dbu.edu.et',
      role: 'STUDENT',
      status: 'ACTIVE',
    } as any);

    const formData = new FormData();
    // Claiming to be image/png, but actually arbitrary text
    const blob = new Blob(['plain text not a png image header'], { type: 'image/png' });
    formData.append('file', blob, 'spoofed.png');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('CORRUPTED_OR_DISGUISED_FILE');
  });

  it('successfully uploads valid PNG image with authentic magic bytes', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({
      id: 'mock-student-id',
      email: 'student@dbu.edu.et',
      role: 'STUDENT',
      status: 'ACTIVE',
    } as any);

    // Authentic PNG header: 89 50 4E 47 0D 0A 1A 0A + 8 bytes chunk header
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
    ]);

    const formData = new FormData();
    const blob = new Blob([pngHeader], { type: 'image/png' });
    formData.append('file', blob, 'campus_event.png');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.mediaType).toBe('IMAGE');
    expect(data.url).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);
  });

  it('successfully uploads valid MP4 video with authentic ftyp container header', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({
      id: 'mock-student-id',
      email: 'student@dbu.edu.et',
      role: 'STUDENT',
      status: 'ACTIVE',
    } as any);

    // Authentic MP4 header: 4 bytes size, 'ftyp', 'isom'
    const mp4Header = new Uint8Array([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ...ftyp
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00  // isom...
    ]);

    const formData = new FormData();
    const blob = new Blob([mp4Header], { type: 'video/mp4' });
    formData.append('file', blob, 'graduation_ceremony.mp4');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.mediaType).toBe('VIDEO');
    expect(data.url).toMatch(/^\/uploads\/[a-f0-9-]+\.mp4$/);
  });
});
