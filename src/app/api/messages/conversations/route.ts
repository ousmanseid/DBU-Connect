import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const createConversationSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch conversations where user is a member
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
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
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    profile: { select: { displayName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const conversations = await Promise.all(
      memberships.map(async (m) => {
        const conv = m.conversation;
        const otherMember = conv.members.find((member) => member.userId !== user.id);
        const latestMsg = conv.messages[0] || null;

        // Calculate unread messages since lastReadAt
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: m.lastReadAt },
            senderId: { not: user.id },
          },
        });

        return {
          id: conv.id,
          updatedAt: conv.updatedAt,
          unreadCount,
          otherMember: otherMember
            ? {
                id: otherMember.user.id,
                displayName: otherMember.user.profile?.displayName || 'DBU Student',
                avatarUrl: otherMember.user.profile?.avatarUrl || null,
                department: otherMember.user.profile?.department || 'Debre Berhan University',
              }
            : null,
          latestMessage: latestMsg
            ? {
                id: latestMsg.id,
                content: latestMsg.content,
                createdAt: latestMsg.createdAt,
                senderId: latestMsg.senderId,
                senderName: latestMsg.sender.profile?.displayName || 'DBU Student',
              }
            : null,
        };
      })
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve conversations.' },
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
    const parsed = createConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { recipientId } = parsed.data;

    if (recipientId === user.id) {
      return NextResponse.json(
        { error: 'INVALID_RECIPIENT', message: 'You cannot start a conversation with yourself.' },
        { status: 400 }
      );
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: { profile: true },
    });

    if (!recipient || recipient.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'Recipient not found.' },
        { status: 404 }
      );
    }

    // Check block list
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: recipientId },
          { blockerId: recipientId, blockedId: user.id },
        ],
      },
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: 'ACTION_BLOCKED', message: 'Messaging is unavailable with this user.' },
        { status: 403 }
      );
    }

    // Check if a direct conversation already exists between these 2 users
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({
        conversationId: existing.id,
        isNew: false,
      });
    }

    // Create new conversation and members atomically
    const newConv = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: { type: 'DIRECT' },
      });

      await tx.conversationMember.createMany({
        data: [
          { conversationId: conv.id, userId: user.id },
          { conversationId: conv.id, userId: recipientId },
        ],
      });

      return conv;
    });

    return NextResponse.json(
      {
        conversationId: newConv.id,
        isNew: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to initiate conversation.' },
      { status: 500 }
    );
  }
}
