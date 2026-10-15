import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, hasRole, ROLES } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, [ROLES.ADMIN, ROLES.SUPER_ADMIN])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Administrative access required to view audit logs.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const where: any = {};
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit,
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
    });

    return NextResponse.json({
      auditLogs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
        actor: {
          email: log.actor.email,
          role: log.actor.role,
          displayName: log.actor.profile?.displayName || 'Administrator',
        },
      })),
    });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve audit logs.' },
      { status: 500 }
    );
  }
}
