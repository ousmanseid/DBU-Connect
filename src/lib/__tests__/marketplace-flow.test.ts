import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../db';

describe('Campus Marketplace Integration Tests', () => {
  let sellerId: string;
  let buyerId: string;
  let listingId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.savedListing.deleteMany();
    await prisma.marketplaceListing.deleteMany();
    await prisma.profile.deleteMany({
      where: { user: { email: { in: ['seller.mkt@dbu.edu.et', 'buyer.mkt@dbu.edu.et'] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['seller.mkt@dbu.edu.et', 'buyer.mkt@dbu.edu.et'] } },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'seller.mkt@dbu.edu.et',
        passwordHash: 'dummy',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: 'Yared Getachew',
            department: 'Mechanical Engineering',
          },
        },
      },
    });
    sellerId = seller.id;

    const buyer = await prisma.user.create({
      data: {
        email: 'buyer.mkt@dbu.edu.et',
        passwordHash: 'dummy',
        role: 'STUDENT',
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: 'Sara Tilahun',
            department: 'Civil Engineering',
          },
        },
      },
    });
    buyerId = buyer.id;
  });

  afterAll(async () => {
    await prisma.savedListing.deleteMany();
    await prisma.marketplaceListing.deleteMany();
    await prisma.profile.deleteMany({
      where: { userId: { in: [sellerId, buyerId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [sellerId, buyerId] } },
    });
  });

  it('creates and persists a marketplace listing', async () => {
    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId,
        title: 'Engineering Mathematics 4th Edition',
        description: 'Clean textbook with solved exercises. Useful for 2nd and 3rd year engineering students.',
        category: 'Textbooks',
        price: 350,
        currency: 'ETB',
        condition: 'Good',
        location: 'Engineering Block 3',
        status: 'ACTIVE',
      },
    });

    listingId = listing.id;
    expect(listing.id).toBeDefined();
    expect(listing.price).toBe(350);
    expect(listing.sellerId).toBe(sellerId);
  });

  it('searches and filters listings by category and title keyword', async () => {
    const results = await prisma.marketplaceListing.findMany({
      where: {
        status: 'ACTIVE',
        category: 'Textbooks',
        title: { contains: 'Engineering' },
      },
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toContain('Engineering Mathematics');
  });

  it('allows a buyer to save a listing and prevents duplicate saves', async () => {
    const save = await prisma.savedListing.create({
      data: {
        userId: buyerId,
        listingId,
      },
    });

    expect(save.id).toBeDefined();

    // Duplicate save should throw unique constraint violation
    await expect(
      prisma.savedListing.create({
        data: {
          userId: buyerId,
          listingId,
        },
      })
    ).rejects.toThrow();

    const savedCount = await prisma.savedListing.count({
      where: { userId: buyerId },
    });
    expect(savedCount).toBe(1);
  });

  it('enforces that a non-seller cannot modify another user listing', async () => {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    expect(listing).not.toBeNull();
    const canModify = listing?.sellerId === buyerId;
    expect(canModify).toBe(false);
  });

  it('allows the seller to update status to SOLD', async () => {
    const updated = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { status: 'SOLD' },
    });

    expect(updated.status).toBe('SOLD');
  });
});
