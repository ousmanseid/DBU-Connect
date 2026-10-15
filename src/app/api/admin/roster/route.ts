import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, hasRole, ROLES } from '@/lib/auth';
import { rosterRowSchema } from '@/lib/validation';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, [ROLES.REGISTRAR, ROLES.SUPER_ADMIN])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Registrar or Super Admin authorization required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const claimedParam = searchParams.get('claimed');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const where: any = {};
    if (status) where.eligibilityStatus = status;
    if (claimedParam !== null && claimedParam !== undefined && claimedParam !== '') {
      where.claimed = claimedParam === 'true';
    }
    if (q) {
      where.OR = [
        { studentId: { contains: q } },
        { universityEmail: { contains: q } },
        { fullName: { contains: q } },
        { department: { contains: q } },
      ];
    }

    const records = await prisma.studentRoster.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.studentRoster.count({ where });

    return NextResponse.json({
      records,
      total,
    });
  } catch (error) {
    console.error('Fetch roster error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve roster records.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, [ROLES.REGISTRAR, ROLES.SUPER_ADMIN])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Registrar credentials required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = rosterRowSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    const existing = await prisma.studentRoster.findFirst({
      where: {
        OR: [
          { studentId: data.studentId.toUpperCase().trim() },
          { universityEmail: data.universityEmail.toLowerCase().trim() },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'DUPLICATE_RECORD',
          message: 'A student roster entry with this Student ID or email already exists.',
        },
        { status: 409 }
      );
    }

    const newEntry = await prisma.studentRoster.create({
      data: {
        studentId: data.studentId.toUpperCase().trim(),
        universityEmail: data.universityEmail.toLowerCase().trim(),
        fullName: data.fullName.trim(),
        department: data.department.trim(),
        faculty: data.faculty.trim(),
        admissionYear: data.admissionYear,
        eligibilityStatus: data.eligibilityStatus,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: 'ROSTER_RECORD_ADDED',
      targetType: 'STUDENT_ROSTER',
      targetId: newEntry.id,
      details: { studentId: newEntry.studentId, email: newEntry.universityEmail },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Student eligibility record created successfully.',
        record: newEntry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add roster error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to add student record.' },
      { status: 500 }
    );
  }
}
