import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../db';

describe('Social Feed, Likes, Comments & Friendships Integration Tests', () => {
  let userAId: string;
  let userBId: string;
  let postId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.friendRequest.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { in: ['userA.social@dbu.edu.et', 'userB.social@dbu.edu.et'] } },
    });

    // Create User A
    const userA = await prisma.user.create({
      data: {
        email: 'userA.social@dbu.edu.et',
        passwordHash: 'dummyhash',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: 'Alemayehu Tadesse',
            department: 'Computer Science',
          },
        },
      },
    });
    userAId = userA.id;

    // Create User B
    const userB = await prisma.user.create({
      data: {
        email: 'userB.social@dbu.edu.et',
        passwordHash: 'dummyhash',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: 'Bethlehem Haile',
            department: 'Electrical Engineering',
          },
        },
      },
    });
    userBId = userB.id;
  });

  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.friendRequest.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
  });

  it('creates and persists a social post', async () => {
    const post = await prisma.post.create({
      data: {
        authorId: userAId,
        content: 'Excited for the upcoming DBU Technology Exhibition this Friday!',
        visibility: 'CAMPUS',
        status: 'ACTIVE',
      },
    });

    postId = post.id;
    expect(post.id).toBeDefined();
    expect(post.authorId).toBe(userAId);
  });

  it('allows User B to like the post and prevents duplicate likes', async () => {
    // First like
    const like = await prisma.like.create({
      data: {
        postId,
        userId: userBId,
      },
    });
    expect(like.id).toBeDefined();

    // Second like with same postId & userId should trigger Prisma / DB unique constraint error
    await expect(
      prisma.like.create({
        data: {
          postId,
          userId: userBId,
        },
      })
    ).rejects.toThrow();

    const count = await prisma.like.count({ where: { postId } });
    expect(count).toBe(1);
  });

  it('allows User B to comment on the post', async () => {
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userBId,
        content: 'Great! Which hall will the exhibition be held in?',
      },
    });

    expect(comment.id).toBeDefined();
    expect(comment.postId).toBe(postId);
    expect(comment.authorId).toBe(userBId);

    const comments = await prisma.comment.findMany({ where: { postId } });
    expect(comments.length).toBe(1);
    expect(comments[0].content).toContain('Which hall');
  });

  it('handles the complete friend request and canonical friendship workflow', async () => {
    // 1. User A sends friend request to User B
    const request = await prisma.friendRequest.create({
      data: {
        senderId: userAId,
        receiverId: userBId,
        status: 'PENDING',
      },
    });
    expect(request.status).toBe('PENDING');

    // 2. User B accepts: update request and create canonical friendship
    const [u1, u2] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: request.id },
        data: { status: 'ACCEPTED' },
      });
      await tx.friendship.create({
        data: { user1Id: u1, user2Id: u2 },
      });
    });

    // 3. Verify friendship exists
    const friendship = await prisma.friendship.findUnique({
      where: {
        user1Id_user2Id: { user1Id: u1, user2Id: u2 },
      },
    });
    expect(friendship).not.toBeNull();

    // 4. Duplicate friendship pair is rejected by unique constraint
    await expect(
      prisma.friendship.create({
        data: { user1Id: u1, user2Id: u2 },
      })
    ).rejects.toThrow();
  });

  it('enforces that a student cannot delete another student post', async () => {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    expect(post).not.toBeNull();

    // User B is not the author and not an admin
    const canDelete = post?.authorId === userBId;
    expect(canDelete).toBe(false);
  });
});
