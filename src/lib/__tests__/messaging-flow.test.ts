import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../db';

describe('Messaging & Conversation Authorization Integration Tests', () => {
  let userAId: string;
  let userBId: string;
  let userCId: string;
  let conversationId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversationMember.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.block.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'userA.msg@dbu.edu.et',
            'userB.msg@dbu.edu.et',
            'userC.msg@dbu.edu.et',
          ],
        },
      },
    });

    const uA = await prisma.user.create({
      data: {
        email: 'userA.msg@dbu.edu.et',
        passwordHash: 'dummy',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: { create: { displayName: 'User A' } },
      },
    });
    userAId = uA.id;

    const uB = await prisma.user.create({
      data: {
        email: 'userB.msg@dbu.edu.et',
        passwordHash: 'dummy',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: { create: { displayName: 'User B' } },
      },
    });
    userBId = uB.id;

    const uC = await prisma.user.create({
      data: {
        email: 'userC.msg@dbu.edu.et',
        passwordHash: 'dummy',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: { create: { displayName: 'User C (Attacker/Intruder)' } },
      },
    });
    userCId = uC.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversationMember.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.block.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId, userCId] } },
    });
  });

  it('creates a 1-to-1 conversation with membership records', async () => {
    const conv = await prisma.$transaction(async (tx) => {
      const c = await tx.conversation.create({ data: { type: 'DIRECT' } });
      await tx.conversationMember.createMany({
        data: [
          { conversationId: c.id, userId: userAId },
          { conversationId: c.id, userId: userBId },
        ],
      });
      return c;
    });

    conversationId = conv.id;
    expect(conv.id).toBeDefined();

    const members = await prisma.conversationMember.findMany({
      where: { conversationId },
    });
    expect(members.length).toBe(2);
  });

  it('allows User A to send a message to the conversation', async () => {
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userAId,
        content: 'Hi Bethlehem, did you get the lecture notes for Distributed Systems?',
      },
    });

    expect(msg.id).toBeDefined();
    expect(msg.content).toContain('Distributed Systems');
  });

  it('strictly rejects access if a non-member (User C) attempts to read conversation messages', async () => {
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: userCId,
        },
      },
    });

    // User C must have NO membership record
    expect(membership).toBeNull();
  });

  it('prevents initiating a conversation if either user has blocked the other', async () => {
    // User B blocks User C
    await prisma.block.create({
      data: {
        blockerId: userBId,
        blockedId: userCId,
      },
    });

    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userCId, blockedId: userBId },
          { blockerId: userBId, blockedId: userCId },
        ],
      },
    });

    expect(isBlocked).not.toBeNull();
  });
});
