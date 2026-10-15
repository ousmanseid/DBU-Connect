import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, hasRole, ROLES } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.SUPER_ADMIN])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Administrative credentials required.' },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalPosts,
      totalListings,
      pendingReports,
      totalRoster,
      claimedRoster,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count({ where: { status: 'ACTIVE' } }),
      prisma.marketplaceListing.count({ where: { status: 'ACTIVE' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.studentRoster.count(),
      prisma.studentRoster.count({ where: { claimed: true } }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              email: true,
              role: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPosts,
        totalListings,
        pendingReports,
        totalRoster,
        claimedRoster,
        activeRate: totalRoster > 0 ? Math.round((claimedRoster / totalRoster) * 100) : 0,
      },
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details,
        createdAt: log.createdAt,
        actor: {
          email: log.actor.email,
          role: log.actor.role,
          name: log.actor.profile?.displayName || 'Administrator',
        },
      })),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to retrieve administrative statistics.' },
      { status: 500 }
    );
  }
}
