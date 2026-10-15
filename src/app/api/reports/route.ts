import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, hasRole, ROLES } from '@/lib/auth';
import { createReportSchema } from '@/lib/validation';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to submit a report.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createReportSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: validated.data.targetType,
        targetId: validated.data.targetId,
        reason: validated.data.reason,
        details: validated.data.details || null,
        status: 'PENDING',
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: 'REPORT_SUBMITTED',
      targetType: validated.data.targetType,
      targetId: validated.data.targetId,
      details: { reason: validated.data.reason },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted for administrative review. Thank you for keeping DBU safe.',
        reportId: report.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit report error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to submit report.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, [ROLES.ADMIN, ROLES.SUPER_ADMIN])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Administrative access required.' },
        { status: 403 }
      );
    }

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve moderation reports.' },
      { status: 500 }
    );
  }
}
