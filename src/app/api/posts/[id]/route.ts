import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createPostSchema } from '@/lib/validation';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            role: true,
            profile: true,
          },
        },
        likes: {
          select: { userId: true },
        },
        comments: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                profile: true,
              },
            },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    if (!post || post.status === 'REMOVED') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Post not found or has been removed.' },
        { status: 404 }
      );
    }

    const user = await getCurrentUser();

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        visibility: post.visibility,
        shareCount: post.shareCount,
        createdAt: post.createdAt,
        author: {
          id: post.author.id,
          role: post.author.role,
          displayName: post.author.profile?.displayName || 'DBU Student',
          avatarUrl: post.author.profile?.avatarUrl || null,
          department: post.author.profile?.department || 'Debre Berhan University',
        },
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        hasLiked: user ? post.likes.some((l) => l.userId === user.id) : false,
        comments: post.comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          author: {
            id: c.author.id,
            displayName: c.author.profile?.displayName || 'DBU Student',
            avatarUrl: c.author.profile?.avatarUrl || null,
          },
        })),
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Error retrieving post.' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    });

    if (!post || post.status === 'REMOVED') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Post not found' },
        { status: 404 }
      );
    }

    // Server-side authorization check: Only author or Admin/Super Admin
    const isAuthor = post.authorId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isAuthor && !isStaff) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You do not have permission to edit this post.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createPostSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.post.update({
      where: { id: params.id },
      data: {
        content: validated.data.content,
        visibility: validated.data.visibility,
        mediaUrl: validated.data.mediaUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully.',
      post: updated,
    });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Error updating post.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    });

    if (!post) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Post not found' },
        { status: 404 }
      );
    }

    // Authorization: author or Admin/Super Admin
    const isAuthor = post.authorId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isAuthor && !isStaff) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You do not have permission to delete this post.' },
        { status: 403 }
      );
    }

    // Soft-delete or hard delete
    await prisma.post.update({
      where: { id: params.id },
      data: { status: 'REMOVED' },
    });

    if (isStaff && !isAuthor) {
      await logAuditEvent({
        actorId: user.id,
        action: 'POST_MODERATED',
        targetType: 'POST',
        targetId: post.id,
        details: { authorId: post.authorId },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Error deleting post.' },
      { status: 500 }
    );
  }
}
