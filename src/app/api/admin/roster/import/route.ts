import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, hasRole, ROLES } from '@/lib/auth';
import { rosterRowSchema } from '@/lib/validation';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, [ROLES.REGISTRAR, ROLES.SUPER_ADMIN])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Registrar authorization required for roster imports.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rows: unknown[] = Array.isArray(body) ? body : body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Payload must contain a non-empty array of student rows.' },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; studentId?: string; message: string }> = [];

    const batchId = `BATCH-${Date.now()}`;

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const parsed = rosterRowSchema.safeParse(rawRow);

      if (!parsed.success) {
        errorCount++;
        errors.push({
          row: i + 1,
          studentId: (rawRow as any)?.studentId,
          message: parsed.error.issues[0].message,
        });
        continue;
      }

      const data = parsed.data;
      const normalizedStudentId = data.studentId.toUpperCase().trim();
      const normalizedEmail = data.universityEmail.toLowerCase().trim();

      try {
        const existing = await prisma.studentRoster.findFirst({
          where: {
            OR: [
              { studentId: normalizedStudentId },
              { universityEmail: normalizedEmail },
            ],
          },
        });

        if (existing) {
          // If already claimed, preserve the claimed status and user linkage!
          await prisma.studentRoster.update({
            where: { id: existing.id },
            data: {
              fullName: data.fullName.trim(),
              department: data.department.trim(),
              faculty: data.faculty.trim(),
              admissionYear: data.admissionYear,
              eligibilityStatus: data.eligibilityStatus,
              importBatchId: batchId,
            },
          });
          updatedCount++;
        } else {
          await prisma.studentRoster.create({
            data: {
              studentId: normalizedStudentId,
              universityEmail: normalizedEmail,
              fullName: data.fullName.trim(),
              department: data.department.trim(),
              faculty: data.faculty.trim(),
              admissionYear: data.admissionYear,
              eligibilityStatus: data.eligibilityStatus,
              claimed: false,
              importBatchId: batchId,
            },
          });
          insertedCount++;
        }
      } catch (err: any) {
        errorCount++;
        errors.push({
          row: i + 1,
          studentId: normalizedStudentId,
          message: err.message || 'Database error during row reconciliation',
        });
      }
    }

    await logAuditEvent({
      actorId: user.id,
      action: 'ROSTER_BATCH_IMPORT',
      targetType: 'STUDENT_ROSTER',
      details: {
        batchId,
        totalSubmitted: rows.length,
        insertedCount,
        updatedCount,
        errorCount,
      },
    });

    return NextResponse.json({
      success: true,
      batchId,
      summary: {
        totalSubmitted: rows.length,
        insertedCount,
        updatedCount,
        errorCount,
      },
      errors: errors.slice(0, 20), // return up to 20 errors for inspection
    });
  } catch (error) {
    console.error('Batch roster import error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to process batch roster import.' },
      { status: 500 }
    );
  }
}
