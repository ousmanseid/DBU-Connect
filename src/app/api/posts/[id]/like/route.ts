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
        { error: 'UNAUTHORIZED', message: 'You must be logged in to like posts.' },
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

    // Check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: post.id,
          userId: user.id,
        },
      },
    });

    let isLiked = false;

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      // Like (Database constraint @@unique([postId, userId]) prevents any duplicate insert)
      await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });
      isLiked = true;

      // Create notification for post author if not liking own post
      if (post.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: user.id,
            type: 'LIKE',
            resourceId: post.id,
            resourceType: 'POST',
            message: `${user.profile?.displayName || 'A student'} liked your campus post.`,
          },
        });
      }
    }

    const likeCount = await prisma.like.count({
      where: { postId: post.id },
    });

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount,
    });
  } catch (error) {
    console.error('Like toggle error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to process like action.' },
      { status: 500 }
    );
  }
}
