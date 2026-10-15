import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createPostSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const cursor = searchParams.get('cursor');

    const posts = await prisma.post.findMany({
      where: {
        status: 'ACTIVE',
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
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
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let items = posts;
    if (posts.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id || null;
    }

    const formattedPosts = items.map((post) => ({
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
    }));

    return NextResponse.json({
      posts: formattedPosts,
      nextCursor,
    });
  } catch (error) {
    console.error('Fetch feed error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to load campus feed.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to create a post.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createPostSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: validated.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const newPost = await prisma.post.create({
      data: {
        authorId: user.id,
        content: validated.data.content,
        mediaUrl: validated.data.mediaUrl || null,
        mediaType: validated.data.mediaType || (validated.data.mediaUrl ? 'IMAGE' : null),
        visibility: validated.data.visibility,
        status: 'ACTIVE',
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

    return NextResponse.json(
      {
        success: true,
        message: 'Post published to campus community.',
        post: {
          id: newPost.id,
          content: newPost.content,
          mediaUrl: newPost.mediaUrl,
          visibility: newPost.visibility,
          createdAt: newPost.createdAt,
          author: {
            id: newPost.author.id,
            role: newPost.author.role,
            displayName: newPost.author.profile?.displayName || 'DBU Student',
            avatarUrl: newPost.author.profile?.avatarUrl || null,
            department: newPost.author.profile?.department || 'Debre Berhan University',
          },
          likeCount: 0,
          commentCount: 0,
          hasLiked: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to create post.' },
      { status: 500 }
    );
  }
}
