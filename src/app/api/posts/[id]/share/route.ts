import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, shareCount: true, status: true },
    });

    if (!post || post.status === 'REMOVED') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Post not found or removed' },
        { status: 404 }
      );
    }

    const updated = await prisma.post.update({
      where: { id: params.id },
      data: {
        shareCount: { increment: 1 },
      },
      select: { id: true, shareCount: true },
    });

    return NextResponse.json({
      success: true,
      shareCount: updated.shareCount,
    });
  } catch (error) {
    console.error('Share post error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to record share.' },
      { status: 500 }
    );
  }
}
