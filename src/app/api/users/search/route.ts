import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be signed in to discover students.' },
        { status: 401 }
      );
    }

    if (currentUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'ACCOUNT_SUSPENDED', message: 'Your account is currently suspended.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const departmentFilter = (searchParams.get('department') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '12', 10)), 50);
    const skip = (page - 1) * limit;

    // Build filter conditions
    const conditions: any[] = [{ status: 'ACTIVE' }];

    if (query) {
      conditions.push({
        profile: {
          OR: [
            { displayName: { contains: query } },
            { department: { contains: query } },
            { bio: { contains: query } },
          ],
        },
      });
    }

    if (departmentFilter && departmentFilter !== 'ALL') {
      conditions.push({
        profile: {
          department: { contains: departmentFilter },
        },
      });
    }

    const whereClause = { AND: conditions };

    // Fetch matching verified students with safe public projection
    const [total, students] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
              department: true,
              bio: true,
              graduationYear: true,
            },
          },
        },
      }),
    ]);

    const studentIds = students.map((s) => s.id);

    // Fetch friendships for current user to compute connection state
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: currentUser.id, user2Id: { in: studentIds } },
          { user2Id: currentUser.id, user1Id: { in: studentIds } },
        ],
      },
    });

    const friendIdSet = new Set<string>();
    for (const f of friendships) {
      friendIdSet.add(f.user1Id === currentUser.id ? f.user2Id : f.user1Id);
    }

    // Fetch pending friend requests involving current user and the found students
    const [sentRequests, receivedRequests] = await Promise.all([
      prisma.friendRequest.findMany({
        where: {
          senderId: currentUser.id,
          receiverId: { in: studentIds },
          status: 'PENDING',
        },
        select: { id: true, receiverId: true },
      }),
      prisma.friendRequest.findMany({
        where: {
          receiverId: currentUser.id,
          senderId: { in: studentIds },
          status: 'PENDING',
        },
        select: { id: true, senderId: true },
      }),
    ]);

    const sentReqMap = new Map<string, string>();
    for (const r of sentRequests) {
      sentReqMap.set(r.receiverId, r.id);
    }

    const receivedReqMap = new Map<string, string>();
    for (const r of receivedRequests) {
      receivedReqMap.set(r.senderId, r.id);
    }

    // Format safe response
    const results = students.map((s) => {
      const isSelf = s.id === currentUser.id;
      const isFriend = friendIdSet.has(s.id);
      const sentRequestId = sentReqMap.get(s.id) || null;
      const receivedRequestId = receivedReqMap.get(s.id) || null;

      let relationshipState: 'SELF' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'CAN_REQUEST';
      if (isSelf) {
        relationshipState = 'SELF';
      } else if (isFriend) {
        relationshipState = 'FRIENDS';
      } else if (sentRequestId) {
        relationshipState = 'REQUEST_SENT';
      } else if (receivedRequestId) {
        relationshipState = 'REQUEST_RECEIVED';
      } else {
        relationshipState = 'CAN_REQUEST';
      }

      return {
        id: s.id,
        displayName: s.profile?.displayName || 'DBU Student',
        avatarUrl: s.profile?.avatarUrl || null,
        department: s.profile?.department || 'Debre Berhan University',
        bio: s.profile?.bio || '',
        graduationYear: s.profile?.graduationYear || null,
        relationship: {
          state: relationshipState,
          isSelf,
          isFriend,
          sentRequestId,
          receivedRequestId,
        },
      };
    });

    return NextResponse.json({
      students: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Student search error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to search student directory.' },
      { status: 500 }
    );
  }
}
