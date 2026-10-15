import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const removeSchema = z.object({
  targetUserId: z.string().min(1),
});

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
    const parsed = removeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Target user ID is required' },
        { status: 400 }
      );
    }

    const { targetUserId } = parsed.data;
    const [u1, u2] = user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id];

    await prisma.friendship.deleteMany({
      where: {
        user1Id: u1,
        user2Id: u2,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Connection removed.',
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to remove connection.' },
      { status: 500 }
    );
  }
}
