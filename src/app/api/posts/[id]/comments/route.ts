import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createCommentSchema } from '@/lib/validation';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId: params.id,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                department: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: {
          id: c.author.id,
          role: c.author.role,
          displayName: c.author.profile?.displayName || 'DBU Student',
          avatarUrl: c.author.profile?.avatarUrl || null,
          department: c.author.profile?.department || 'Debre Berhan University',
        },
      })),
    });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to retrieve comments.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to comment.' },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, authorId: true, status: true },
    });

    if (!post || post.status === 'REMOVED') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Post not found or removed.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = createCommentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: user.id,
        content: validated.data.content,
      },
      include: {
        author: {
          select: {
            id: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                department: true,
              },
            },
          },
        },
      },
    });

    // Notify author if not commenting on own post
    if (post.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: user.id,
          type: 'COMMENT',
          resourceId: post.id,
          resourceType: 'POST',
          message: `${user.profile?.displayName || 'A student'} commented on your post: "${validated.data.content.slice(0, 50)}..."`,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Comment added.',
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          author: {
            id: comment.author.id,
            role: comment.author.role,
            displayName: comment.author.profile?.displayName || 'DBU Student',
            avatarUrl: comment.author.profile?.avatarUrl || null,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to add comment.' },
      { status: 500 }
    );
  }
}
