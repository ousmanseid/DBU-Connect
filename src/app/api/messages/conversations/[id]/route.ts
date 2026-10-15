import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const postMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
});

export async function GET(
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

    // Server-side authorization check: User MUST be an enrolled member of this conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: params.id,
          userId: user.id,
        },
      },
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
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Access denied. You are not a participant in this conversation.',
        },
        { status: 403 }
      );
    }

    // Update lastReadAt for current user
    await prisma.conversationMember.update({
      where: { id: membership.id },
      data: { lastReadAt: new Date() },
    });

    // Fetch conversation message history
    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const otherMember = membership.conversation.members.find(
      (m) => m.userId !== user.id
    );

    return NextResponse.json({
      conversation: {
        id: params.id,
        otherMember: otherMember
          ? {
              id: otherMember.user.id,
              displayName: otherMember.user.profile?.displayName || 'DBU Student',
              avatarUrl: otherMember.user.profile?.avatarUrl || null,
              department: otherMember.user.profile?.department || 'Debre Berhan University',
            }
          : null,
      },
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        isOwn: m.senderId === user.id,
        sender: {
          id: m.sender.id,
          displayName: m.sender.profile?.displayName || 'DBU Student',
          avatarUrl: m.sender.profile?.avatarUrl || null,
        },
      })),
    });
  } catch (error) {
    console.error('Fetch conversation messages error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve messages.' },
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
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Server-side authorization check: Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: params.id,
          userId: user.id,
        },
      },
      include: {
        conversation: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'You are not authorized to send messages in this conversation.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = postMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Persist message in database and update conversation timestamp
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: params.id,
          senderId: user.id,
          content: parsed.data.content,
        },
        include: {
          sender: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });

      // Update current sender's lastReadAt
      await tx.conversationMember.update({
        where: { id: membership.id },
        data: { lastReadAt: new Date() },
      });

      return msg;
    });

    // Notify other participant(s)
    const otherMembers = membership.conversation.members.filter(
      (m) => m.userId !== user.id
    );

    for (const recipient of otherMembers) {
      await prisma.notification.create({
        data: {
          recipientId: recipient.userId,
          actorId: user.id,
          type: 'MESSAGE',
          resourceId: params.id,
          resourceType: 'CONVERSATION',
          message: `${user.profile?.displayName || 'A student'} sent you a message: "${parsed.data.content.slice(0, 40)}..."`,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          isOwn: true,
          sender: {
            id: message.sender.id,
            displayName: message.sender.profile?.displayName || 'DBU Student',
            avatarUrl: message.sender.profile?.avatarUrl || null,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to send message.' },
      { status: 500 }
    );
  }
}
