import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../db';
import { GET } from '@/app/api/users/search/route';
import * as auth from '@/lib/auth';
import { vi } from 'vitest';

describe('Student Directory Search & Privacy Integration Tests', () => {
  let studentAId: string;
  let studentBId: string;
  let suspendedStudentId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.friendship.deleteMany();
    await prisma.friendRequest.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'search.studentA@dbu.edu.et',
            'search.studentB@dbu.edu.et',
            'search.suspended@dbu.edu.et',
          ],
        },
      },
    });

    // Create active Student A (Computer Science)
    const userA = await prisma.user.create({
      data: {
        email: 'search.studentA@dbu.edu.et',
        passwordHash: 'dummyhash',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: 'Ousman Seid',
            department: 'Computer Science',
            bio: 'Software engineer and student developer at Debre Berhan University',
            graduationYear: 2026,
          },
        },
      },
    });
    studentAId = userA.id;

    // Create active Student B (Electrical Engineering)
    const userB = await prisma.user.create({
      data: {
        email: 'search.studentB@dbu.edu.et',
        passwordHash: 'dummyhash',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: 'Bethlehem Haile',
            department: 'Electrical Engineering',
            bio: 'Embedded systems and IoT enthusiast',
            graduationYear: 2025,
          },
        },
      },
    });
    studentBId = userB.id;

    // Create SUSPENDED student (should be excluded from directory)
    const userSuspended = await prisma.user.create({
      data: {
        email: 'search.suspended@dbu.edu.et',
        passwordHash: 'dummyhash',
        role: 'STUDENT',
        status: 'SUSPENDED',
        profile: {
          create: {
            displayName: 'Suspended Account',
            department: 'Computer Science',
          },
        },
      },
    });
    suspendedStudentId = userSuspended.id;
  });

  afterAll(async () => {
    await prisma.friendship.deleteMany();
    await prisma.friendRequest.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany({
      where: {
        id: { in: [studentAId, studentBId, suspendedStudentId] },
      },
    });
  });

  it('rejects unauthenticated directory requests with 401', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/users/search?q=Ousman');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('searches students by name and department while excluding suspended accounts', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({
      id: studentAId,
      email: 'search.studentA@dbu.edu.et',
      role: 'STUDENT',
      status: 'ACTIVE',
    } as any);

    const req = new Request('http://localhost:3000/api/users/search?q=Bethlehem');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.students).toBeDefined();
    expect(data.students.length).toBe(1);
    expect(data.students[0].displayName).toBe('Bethlehem Haile');
    expect(data.students[0].department).toBe('Electrical Engineering');

    // Ensure suspended account is never found
    const reqSuspended = new Request('http://localhost:3000/api/users/search?q=Suspended');
    const resSuspended = await GET(reqSuspended);
    const dataSuspended = await resSuspended.json();
    expect(dataSuspended.students.length).toBe(0);
  });

  it('enforces strict privacy: never exposes passwords, private emails, or phone numbers in search', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({
      id: studentAId,
      email: 'search.studentA@dbu.edu.et',
      role: 'STUDENT',
      status: 'ACTIVE',
    } as any);

    const req = new Request('http://localhost:3000/api/users/search?q=Bethlehem');
    const res = await GET(req);
    const data = await res.json();

    const studentRecord = data.students[0];
    expect(studentRecord.passwordHash).toBeUndefined();
    expect(studentRecord.email).toBeUndefined();
    expect(studentRecord.studentId).toBeUndefined();
    expect(studentRecord.phone).toBeUndefined();
    expect(studentRecord.role).toBeUndefined();
  });

  it('correctly reports relationship state between students', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({
      id: studentAId,
      email: 'search.studentA@dbu.edu.et',
      role: 'STUDENT',
      status: 'ACTIVE',
    } as any);

    // Initial state: can request
    const req1 = new Request('http://localhost:3000/api/users/search?q=Bethlehem');
    const res1 = await GET(req1);
    const data1 = await res1.json();
    expect(data1.students[0].relationship.state).toBe('CAN_REQUEST');
    expect(data1.students[0].relationship.isFriend).toBe(false);

    // Self check
    const reqSelf = new Request('http://localhost:3000/api/users/search?q=Ousman');
    const resSelf = await GET(reqSelf);
    const dataSelf = await resSelf.json();
    expect(dataSelf.students[0].relationship.isSelf).toBe(true);
    expect(dataSelf.students[0].relationship.state).toBe('SELF');

    // After sending request: state should be REQUEST_SENT
    const fr = await prisma.friendRequest.create({
      data: {
        senderId: studentAId,
        receiverId: studentBId,
        status: 'PENDING',
      },
    });

    const req2 = new Request('http://localhost:3000/api/users/search?q=Bethlehem');
    const res2 = await GET(req2);
    const data2 = await res2.json();
    expect(data2.students[0].relationship.state).toBe('REQUEST_SENT');
    expect(data2.students[0].relationship.sentRequestId).toBe(fr.id);

    // Clean up
    await prisma.friendRequest.deleteMany();
  });
});
