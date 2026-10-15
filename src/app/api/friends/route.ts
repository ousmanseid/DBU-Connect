import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { friendRequestActionSchema } from '@/lib/validation';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 1. Fetch canonical friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
    });

    const friendUserIds = friendships.map((f) =>
      f.user1Id === user.id ? f.user2Id : f.user1Id
    );

    const friends = await prisma.user.findMany({
      where: {
        id: { in: friendUserIds },
        status: 'ACTIVE',
      },
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
    });

    // 2. Fetch received pending requests
    const receivedRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: user.id,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
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

    // 3. Fetch sent pending requests
    const sentRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: user.id,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: {
            id: true,
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
      friends: friends.map((f) => ({
        id: f.id,
        displayName: f.profile?.displayName || 'DBU Student',
        avatarUrl: f.profile?.avatarUrl || null,
        department: f.profile?.department || 'Debre Berhan University',
      })),
      receivedRequests: receivedRequests.map((r) => ({
        id: r.id,
        senderId: r.senderId,
        createdAt: r.createdAt,
        sender: {
          displayName: r.sender.profile?.displayName || 'DBU Student',
          avatarUrl: r.sender.profile?.avatarUrl || null,
          department: r.sender.profile?.department || 'Debre Berhan University',
        },
      })),
      sentRequests: sentRequests.map((r) => ({
        id: r.id,
        receiverId: r.receiverId,
        createdAt: r.createdAt,
        receiver: {
          displayName: r.receiver.profile?.displayName || 'DBU Student',
          avatarUrl: r.receiver.profile?.avatarUrl || null,
          department: r.receiver.profile?.department || 'Debre Berhan University',
        },
      })),
    });
  } catch (error) {
    console.error('Get friends error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve connections.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = friendRequestActionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { targetUserId } = validated.data;

    // Self-request check
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'You cannot send a friend request to yourself.' },
        { status: 400 }
      );
    }

    // Target exists check
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!targetUser || targetUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'The specified student could not be found.' },
        { status: 404 }
      );
    }

    // Check block list
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: user.id },
        ],
      },
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: 'ACTION_BLOCKED', message: 'Unable to send friend request to this user.' },
        { status: 403 }
      );
    }

    // Check existing canonical friendship
    const [u1, u2] = user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id];
    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: u1,
          user2Id: u2,
        },
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'ALREADY_FRIENDS', message: 'You are already connected with this student.' },
        { status: 409 }
      );
    }

    // Check existing pending request in either direction
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUserId, status: 'PENDING' },
          { senderId: targetUserId, receiverId: user.id, status: 'PENDING' },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'REQUEST_PENDING',
          message: 'A connection request between you is already pending.',
        },
        { status: 409 }
      );
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: user.id,
        receiverId: targetUserId,
        status: 'PENDING',
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        recipientId: targetUserId,
        actorId: user.id,
        type: 'FRIEND_REQUEST',
        resourceId: friendRequest.id,
        resourceType: 'FRIEND_REQUEST',
        message: `${user.profile?.displayName || 'A student'} sent you a friend request.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Friend request sent successfully.',
        requestId: friendRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send friend request error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to send friend request.' },
      { status: 500 }
    );
  }
}
