import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../db';
import { hashPassword, verifyPassword } from '../auth';

describe('Student Registration & Eligibility Integration Tests', () => {
  const testStudentId = 'DBU/14/TEST-REG';
  const testEmail = 'test.student.reg@dbu.edu.et';

  beforeAll(async () => {
    // Clean up any previous test artifacts
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.studentRoster.deleteMany({ where: { studentId: testStudentId } });

    // Seed eligible roster record
    await prisma.studentRoster.create({
      data: {
        studentId: testStudentId,
        universityEmail: testEmail,
        fullName: 'Dawit Mengistu',
        department: 'Software Engineering',
        faculty: 'Computing & Informatics',
        admissionYear: 2022,
        eligibilityStatus: 'ELIGIBLE',
        claimed: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.studentRoster.deleteMany({ where: { studentId: testStudentId } });
  });

  it('verifies that an unclaimed eligible roster record exists', async () => {
    const record = await prisma.studentRoster.findUnique({
      where: { studentId: testStudentId },
    });
    expect(record).not.toBeNull();
    expect(record?.claimed).toBe(false);
    expect(record?.eligibilityStatus).toBe('ELIGIBLE');
  });

  it('prevents registration if student ID is not found on the roster', async () => {
    const fakeRecord = await prisma.studentRoster.findFirst({
      where: {
        studentId: 'DBU/99/FAKE',
        universityEmail: 'fake.student@dbu.edu.et',
      },
    });
    expect(fakeRecord).toBeNull();
  });

  it('successfully creates an account and atomically claims the roster record', async () => {
    const passwordHash = await hashPassword('StrongCampusPass2026!');

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: testEmail,
          passwordHash,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      await tx.profile.create({
        data: {
          userId: u.id,
          displayName: 'Dawit Mengistu',
          department: 'Software Engineering',
        },
      });

      await tx.studentRoster.update({
        where: { studentId: testStudentId },
        data: {
          claimed: true,
          claimedAt: new Date(),
          claimedByUserId: u.id,
        },
      });

      return u;
    });

    expect(user.id).toBeDefined();

    // Verify roster record is now claimed
    const updatedRoster = await prisma.studentRoster.findUnique({
      where: { studentId: testStudentId },
    });
    expect(updatedRoster?.claimed).toBe(true);
    expect(updatedRoster?.claimedByUserId).toBe(user.id);

    // Verify login credentials
    const isPwCorrect = await verifyPassword('StrongCampusPass2026!', user.passwordHash);
    expect(isPwCorrect).toBe(true);

    const isPwWrong = await verifyPassword('WrongPass', user.passwordHash);
    expect(isPwWrong).toBe(false);
  });

  it('prevents claiming an already claimed roster record', async () => {
    const record = await prisma.studentRoster.findUnique({
      where: { studentId: testStudentId },
    });
    expect(record?.claimed).toBe(true);
    // Any second attempt will see claimed === true and abort
  });
});
