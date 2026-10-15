import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
});

export async function PUT(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Action must be ACCEPT or DECLINE' },
        { status: 400 }
      );
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: params.requestId },
      include: { sender: { include: { profile: true } } },
    });

    if (!friendRequest || friendRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Pending friend request not found' },
        { status: 404 }
      );
    }

    // Security check: Only the designated recipient can accept or decline!
    if (friendRequest.receiverId !== user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You cannot respond to a request sent to another user.' },
        { status: 403 }
      );
    }

    if (validated.data.action === 'DECLINE') {
      await prisma.friendRequest.update({
        where: { id: friendRequest.id },
        data: { status: 'DECLINED' },
      });

      return NextResponse.json({
        success: true,
        message: 'Friend request declined.',
      });
    }

    // Action is ACCEPT: Atomically update request and create canonical Friendship pair
    const [u1, u2] =
      friendRequest.senderId < user.id
        ? [friendRequest.senderId, user.id]
        : [user.id, friendRequest.senderId];

    await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: friendRequest.id },
        data: { status: 'ACCEPTED' },
      });

      // Upsert canonical friendship record
      await tx.friendship.upsert({
        where: {
          user1Id_user2Id: {
            user1Id: u1,
            user2Id: u2,
          },
        },
        create: {
          user1Id: u1,
          user2Id: u2,
        },
        update: {},
      });

      // Notify the sender
      await tx.notification.create({
        data: {
          recipientId: friendRequest.senderId,
          actorId: user.id,
          type: 'FRIEND_ACCEPTED',
          message: `${user.profile?.displayName || 'A student'} accepted your friend request.`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted.',
    });
  } catch (error) {
    console.error('Update friend request error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to process friend request.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Request not found' },
        { status: 404 }
      );
    }

    // Security check: Only the sender can cancel a pending request
    if (friendRequest.senderId !== user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only the sender can cancel a sent friend request.' },
        { status: 403 }
      );
    }

    await prisma.friendRequest.update({
      where: { id: friendRequest.id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Friend request cancelled.',
    });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to cancel request.' },
      { status: 500 }
    );
  }
}
