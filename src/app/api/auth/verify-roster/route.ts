import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { DBU_EMAIL_REGEX } from '@/lib/validation';

const checkSchema = z.object({
  email: z.string().email().refine((val) => DBU_EMAIL_REGEX.test(val)),
  studentId: z.string().min(4),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          eligible: false,
          message: 'Please provide a valid @dbu.edu.et email and student ID number.',
        },
        { status: 400 }
      );
    }

    const { email, studentId } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedStudentId = studentId.toUpperCase().trim();

    // Check if user already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({
        eligible: false,
        alreadyRegistered: true,
        message: 'An active account already exists for this email. Please log in.',
      });
    }

    // Check roster
    const rosterRecord = await prisma.studentRoster.findFirst({
      where: {
        universityEmail: normalizedEmail,
        studentId: normalizedStudentId,
      },
    });

    if (!rosterRecord) {
      return NextResponse.json({
        eligible: false,
        message: 'No matching student record found in official registrar records.',
      });
    }

    if (rosterRecord.claimed) {
      return NextResponse.json({
        eligible: false,
        claimed: true,
        message: 'This student record has already been claimed.',
      });
    }

    if (rosterRecord.eligibilityStatus !== 'ELIGIBLE') {
      return NextResponse.json({
        eligible: false,
        restricted: true,
        message: `Status is currently '${rosterRecord.eligibilityStatus}'. Contact registrar.`,
      });
    }

    return NextResponse.json({
      eligible: true,
      department: rosterRecord.department,
      faculty: rosterRecord.faculty,
      fullName: rosterRecord.fullName,
      admissionYear: rosterRecord.admissionYear,
    });
  } catch (error) {
    console.error('Verify roster error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to check roster records.' },
      { status: 500 }
    );
  }
}
