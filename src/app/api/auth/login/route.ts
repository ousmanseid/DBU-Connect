import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { loginSchema } from '@/lib/validation';
import { verifyPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: validatedData.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email, password } = validatedData.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid university email or password.',
        },
        { status: 401 }
      );
    }

    // 2. Check account status
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          error: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended by campus administration.',
        },
        { status: 403 }
      );
    }

    if (user.status === 'DISABLED') {
      return NextResponse.json(
        {
          error: 'ACCOUNT_DISABLED',
          message: 'This account has been deactivated.',
        },
        { status: 403 }
      );
    }

    // 3. Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid university email or password.',
        },
        { status: 401 }
      );
    }

    // 4. Generate Session Token
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Audit log
    await logAuditEvent({
      actorId: user.id,
      action: 'USER_LOGIN',
      targetType: 'USER',
      targetId: user.id,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Successfully logged in.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.profile?.displayName || 'DBU Student',
          avatarUrl: user.profile?.avatarUrl || null,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during login.',
      },
      { status: 500 }
    );
  }
}
