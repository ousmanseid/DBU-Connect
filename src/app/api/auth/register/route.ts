import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { registerSchema } from '@/lib/validation';
import { hashPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: validatedData.error.issues[0].message,
          issues: validatedData.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, studentId, displayName, department } = validatedData.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedStudentId = studentId.toUpperCase().trim();

    // 1. Check if an account with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'ACCOUNT_EXISTS',
          message: 'An account with this institutional email already exists. Please log in.',
        },
        { status: 409 }
      );
    }

    // 2. Check student eligibility against official Registrar roster
    const rosterRecord = await prisma.studentRoster.findFirst({
      where: {
        universityEmail: normalizedEmail,
        studentId: normalizedStudentId,
      },
    });

    if (!rosterRecord) {
      return NextResponse.json(
        {
          error: 'ROSTER_NOT_FOUND',
          message:
            'Institutional eligibility could not be verified. Your email or student ID does not match official registrar records.',
        },
        { status: 403 }
      );
    }

    if (rosterRecord.eligibilityStatus !== 'ELIGIBLE') {
      return NextResponse.json(
        {
          error: 'ELIGIBILITY_RESTRICTED',
          message: `Your student eligibility is currently flagged as '${rosterRecord.eligibilityStatus}'. Please contact the registrar's office.`,
        },
        { status: 403 }
      );
    }

    if (rosterRecord.claimed) {
      return NextResponse.json(
        {
          error: 'ROSTER_ALREADY_CLAIMED',
          message: 'This institutional student profile has already been claimed and activated.',
        },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create User, Profile, and update Roster entry atomically in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: 'STUDENT',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
          displayName: displayName.trim(),
          department: department || rosterRecord.department,
          graduationYear: rosterRecord.admissionYear + 4,
          privacyLevel: 'CAMPUS_ONLY',
        },
      });

      await tx.studentRoster.update({
        where: { id: rosterRecord.id },
        data: {
          claimed: true,
          claimedAt: new Date(),
          claimedByUserId: user.id,
        },
      });

      return user;
    });

    // 5. Audit log
    await logAuditEvent({
      actorId: newUser.id,
      action: 'USER_REGISTERED',
      targetType: 'USER',
      targetId: newUser.id,
      details: {
        email: normalizedEmail,
        studentId: normalizedStudentId,
        department: rosterRecord.department,
      },
    });

    // 6. Generate Session Token and Cookie
    const sessionToken = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account successfully registered and verified.',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          displayName: displayName.trim(),
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during registration. Please try again.',
      },
      { status: 500 }
    );
  }
}
