import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../db';
import { hasRole, ROLES } from '../auth';

describe('Admin & Registrar Workflows Integration Tests', () => {
  let superAdminId: string;
  let registrarId: string;
  let studentId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({
      where: { actor: { email: { in: ['super@dbu.edu.et', 'registrar@dbu.edu.et', 'regular.student@dbu.edu.et'] } } },
    });
    await prisma.profile.deleteMany({
      where: { user: { email: { in: ['super@dbu.edu.et', 'registrar@dbu.edu.et', 'regular.student@dbu.edu.et'] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['super@dbu.edu.et', 'registrar@dbu.edu.et', 'regular.student@dbu.edu.et'] } },
    });

    const superAdmin = await prisma.user.create({
      data: {
        email: 'super@dbu.edu.et',
        passwordHash: 'dummy',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        profile: { create: { displayName: 'Super Administrator' } },
      },
    });
    superAdminId = superAdmin.id;

    const registrar = await prisma.user.create({
      data: {
        email: 'registrar@dbu.edu.et',
        passwordHash: 'dummy',
        role: 'REGISTRAR',
        status: 'ACTIVE',
        profile: { create: { displayName: 'University Registrar Officer' } },
      },
    });
    registrarId = registrar.id;

    const student = await prisma.user.create({
      data: {
        email: 'regular.student@dbu.edu.et',
        passwordHash: 'dummy',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: { create: { displayName: 'Regular Student' } },
      },
    });
    studentId = student.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { actorId: { in: [superAdminId, registrarId, studentId] } },
    });
    await prisma.profile.deleteMany({
      where: { userId: { in: [superAdminId, registrarId, studentId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [superAdminId, registrarId, studentId] } },
    });
    await prisma.studentRoster.deleteMany({
      where: { studentId: { in: ['DBU/TEST/001', 'DBU/TEST/002'] } },
    });
  });

  it('validates role hierarchy and permission checking rules', () => {
    // Student should not have registrar or admin privileges
    expect(hasRole(ROLES.STUDENT, [ROLES.REGISTRAR, ROLES.ADMIN])).toBe(false);

    // Registrar should have registrar role
    expect(hasRole(ROLES.REGISTRAR, [ROLES.REGISTRAR])).toBe(true);

    // Super Admin inherits all roles
    expect(hasRole(ROLES.SUPER_ADMIN, [ROLES.REGISTRAR])).toBe(true);
    expect(hasRole(ROLES.SUPER_ADMIN, [ROLES.ADMIN])).toBe(true);
  });

  it('imports batch roster records with duplicate handling', async () => {
    const batch = [
      {
        studentId: 'DBU/TEST/001',
        universityEmail: 'student.one@dbu.edu.et',
        fullName: 'Student One',
        department: 'Electrical Engineering',
        faculty: 'Engineering',
        admissionYear: 2023,
        eligibilityStatus: 'ELIGIBLE',
      },
      {
        studentId: 'DBU/TEST/002',
        universityEmail: 'student.two@dbu.edu.et',
        fullName: 'Student Two',
        department: 'Information Technology',
        faculty: 'Informatics',
        admissionYear: 2023,
        eligibilityStatus: 'ELIGIBLE',
      },
    ];

    // Insert batch
    for (const row of batch) {
      await prisma.studentRoster.upsert({
        where: { studentId: row.studentId },
        create: row,
        update: {
          fullName: row.fullName,
          department: row.department,
        },
      });
    }

    const count = await prisma.studentRoster.count({
      where: { studentId: { in: ['DBU/TEST/001', 'DBU/TEST/002'] } },
    });
    expect(count).toBe(2);

    // Re-importing should update without duplicating records
    for (const row of batch) {
      await prisma.studentRoster.upsert({
        where: { studentId: row.studentId },
        create: row,
        update: { fullName: `${row.fullName} Updated` },
      });
    }

    const recheck = await prisma.studentRoster.findUnique({
      where: { studentId: 'DBU/TEST/001' },
    });
    expect(recheck?.fullName).toBe('Student One Updated');
  });

  it('creates an audit log entry for administrative role modification', async () => {
    const log = await prisma.auditLog.create({
      data: {
        actorId: superAdminId,
        action: 'ROLE_ASSIGNED',
        targetType: 'USER',
        targetId: studentId,
        details: JSON.stringify({ assignedRole: 'ADMIN' }),
      },
    });

    expect(log.id).toBeDefined();
    expect(log.action).toBe('ROLE_ASSIGNED');
    expect(log.actorId).toBe(superAdminId);
  });
});
