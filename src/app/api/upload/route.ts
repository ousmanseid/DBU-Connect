import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Supported media types and size limits
const ALLOWED_IMAGE_MIMES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const ALLOWED_VIDEO_MIMES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validates binary signature (magic bytes) to prevent extension/MIME spoofing
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // GIF: GIF87a or GIF89a
  if (mimeType === 'image/gif') {
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }

  // WebP: RIFF .... WEBP
  if (mimeType === 'image/webp') {
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    return riff === 'RIFF' && webp === 'WEBP';
  }

  // MP4 / MOV: usually contains 'ftyp' at offset 4
  if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') {
    const ftyp = buffer.subarray(4, 8).toString('ascii');
    return ftyp === 'ftyp' || ftyp === 'moov' || ftyp === 'wide' || ftyp === 'mdat';
  }

  // WebM: 1A 45 DF A3 (EBML ID)
  if (mimeType === 'video/webm') {
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be signed in to upload media files.' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'ACCOUNT_SUSPENDED', message: 'Your account is not active.' },
        { status: 403 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Expected multipart/form-data upload.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'No media file was uploaded.' },
        { status: 400 }
      );
    }

    const mime = file.type.toLowerCase();
    const isImage = !!ALLOWED_IMAGE_MIMES[mime];
    const isVideo = !!ALLOWED_VIDEO_MIMES[mime];

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error: 'UNSUPPORTED_TYPE',
          message: 'Unsupported media format. Allowed: JPG, PNG, WebP, GIF, MP4, WebM, MOV.',
        },
        { status: 415 }
      );
    }

    const mediaType = isImage ? 'IMAGE' : 'VIDEO';
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    const maxSizeLabel = isImage ? '10MB' : '50MB';

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'FILE_TOO_LARGE',
          message: `File exceeds maximum allowed size for ${mediaType.toLowerCase()}s (${maxSizeLabel}).`,
        },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'EMPTY_FILE', message: 'Uploaded file is empty.' },
        { status: 400 }
      );
    }

    // Convert file to buffer and validate magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isValidSignature = validateMagicBytes(buffer, mime);
    if (!isValidSignature) {
      return NextResponse.json(
        {
          error: 'CORRUPTED_OR_DISGUISED_FILE',
          message: 'File content does not match the declared media format signature.',
        },
        { status: 400 }
      );
    }

    // Determine extension safely from trusted whitelist
    const ext = isImage ? ALLOWED_IMAGE_MIMES[mime] : ALLOWED_VIDEO_MIMES[mime];
    const uniqueFileName = `${crypto.randomUUID()}${ext}`;

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Write file to filesystem
    const targetPath = path.join(uploadsDir, uniqueFileName);
    await fs.writeFile(targetPath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        mediaType,
        filename: uniqueFileName,
        originalName: file.name,
        size: file.size,
        mimeType: mime,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('File upload handler error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to process media upload.' },
      { status: 500 }
    );
  }
}
