import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, hasRole, ROLES } from '@/lib/auth';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit';

const updateUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['STUDENT', 'ADMIN', 'REGISTRAR', 'SUPER_ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, [ROLES.ADMIN, ROLES.SUPER_ADMIN])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Administrative access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { email: { contains: q } },
        { profile: { displayName: { contains: q } } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve user accounts.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasRole(currentUser.role, [ROLES.ADMIN, ROLES.SUPER_ADMIN])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Administrative authorization required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId, role, status } = validated.data;

    // Rule: A user cannot change their own role!
    if (userId === currentUser.id && role && role !== currentUser.role) {
      return NextResponse.json(
        { error: 'SELF_PRIVILEGE_PROHIBITED', message: 'Users cannot alter their own administrative privileges.' },
        { status: 403 }
      );
    }

    // Rule: Only SUPER_ADMIN can assign or revoke administrative roles (ADMIN, REGISTRAR, SUPER_ADMIN)
    if (role && currentUser.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only the Super Administrator can modify user roles.' },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Target user account not found.' },
        { status: 404 }
      );
    }

    // Prevent non-super-admin from modifying a super admin account
    if (targetUser.role === ROLES.SUPER_ADMIN && currentUser.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Cannot modify a Super Administrator account.' },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      action: 'USER_ACCOUNT_UPDATED',
      targetType: 'USER',
      targetId: userId,
      details: {
        previousRole: targetUser.role,
        newRole: role || targetUser.role,
        previousStatus: targetUser.status,
        newStatus: status || targetUser.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User account updated successfully.',
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Update user account error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to update user account.' },
      { status: 500 }
    );
  }
}
