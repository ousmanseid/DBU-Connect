import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  department: z.string().max(100).optional(),
  privacyLevel: z.enum(['PUBLIC', 'CAMPUS_ONLY', 'FRIENDS_ONLY']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        profile: true,
        _count: {
          select: {
            posts: { where: { status: 'ACTIVE' } },
            marketplaceListings: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Student profile not found.' },
        { status: 404 }
      );
    }

    // Count friends
    const friendCount = await prisma.friendship.count({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
    });

    // Check relationship if viewer is logged in
    const viewer = await getCurrentUser();
    let isFriend = false;
    let hasPendingRequest = false;

    if (viewer && viewer.id !== user.id) {
      const [u1, u2] = viewer.id < user.id ? [viewer.id, user.id] : [user.id, viewer.id];
      const friendship = await prisma.friendship.findUnique({
        where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
      });
      isFriend = !!friendship;

      if (!isFriend) {
        const pending = await prisma.friendRequest.findFirst({
          where: {
            senderId: viewer.id,
            receiverId: user.id,
            status: 'PENDING',
          },
        });
        hasPendingRequest = !!pending;
      }
    }

    return NextResponse.json({
      profile: {
        userId: user.id,
        role: user.role,
        displayName: user.profile?.displayName || 'DBU Student',
        bio: user.profile?.bio || '',
        avatarUrl: user.profile?.avatarUrl || null,
        department: user.profile?.department || 'Debre Berhan University',
        graduationYear: user.profile?.graduationYear || null,
        privacyLevel: user.profile?.privacyLevel || 'CAMPUS_ONLY',
        createdAt: user.createdAt,
        stats: {
          postCount: user._count.posts,
          listingCount: user._count.marketplaceListings,
          friendCount,
        },
        relationship: {
          isSelf: viewer?.id === user.id,
          isFriend,
          hasPendingRequest,
        },
      },
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve profile.' },
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

    // Strict Object-Level Authorization: User can ONLY edit their own profile
    if (user.id !== params.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You cannot modify another student\'s profile.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        ...(parsed.data.displayName ? { displayName: parsed.data.displayName } : {}),
        ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio } : {}),
        ...(parsed.data.avatarUrl !== undefined ? { avatarUrl: parsed.data.avatarUrl } : {}),
        ...(parsed.data.department ? { department: parsed.data.department } : {}),
        ...(parsed.data.privacyLevel ? { privacyLevel: parsed.data.privacyLevel } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: updated,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
