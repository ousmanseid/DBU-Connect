import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { marketplaceCategories, marketplaceConditions } from '@/lib/validation';
import { logAuditEvent } from '@/lib/audit';

const updateListingSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(3000).optional(),
  category: z.enum(marketplaceCategories).optional(),
  price: z.number().positive().optional(),
  condition: z.enum(marketplaceConditions).optional(),
  status: z.enum(['ACTIVE', 'RESERVED', 'SOLD', 'REMOVED']).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().max(100).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    if (!listing || listing.status === 'REMOVED') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Marketplace listing not found.' },
        { status: 404 }
      );
    }

    const user = await getCurrentUser();
    let isSaved = false;

    if (user) {
      const saved = await prisma.savedListing.findUnique({
        where: {
          userId_listingId: {
            userId: user.id,
            listingId: listing.id,
          },
        },
      });
      isSaved = !!saved;
    }

    return NextResponse.json({
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        price: listing.price,
        currency: listing.currency,
        condition: listing.condition,
        status: listing.status,
        imageUrl: listing.imageUrl,
        location: listing.location,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        isSaved,
        isOwner: user?.id === listing.sellerId,
        seller: {
          id: listing.seller.id,
          displayName: listing.seller.profile?.displayName || 'DBU Student',
          avatarUrl: listing.seller.profile?.avatarUrl || null,
          department: listing.seller.profile?.department || 'Debre Berhan University',
          email: listing.seller.email,
          phone: listing.seller.profile?.phone || null,
        },
      },
    });
  } catch (error) {
    console.error('Fetch listing error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to retrieve listing.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Listing not found' },
        { status: 404 }
      );
    }

    // Server-side authorization check: Only seller or Admin/Super Admin
    const isOwner = listing.sellerId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You do not have permission to modify this listing.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Listing updated.',
      listing: updated,
    });
  } catch (error) {
    console.error('Update listing error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to update listing.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Listing not found' },
        { status: 404 }
      );
    }

    const isOwner = listing.sellerId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You do not have permission to delete this listing.' },
        { status: 403 }
      );
    }

    await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: { status: 'REMOVED' },
    });

    if (isStaff && !isOwner) {
      await logAuditEvent({
        actorId: user.id,
        action: 'LISTING_MODERATED',
        targetType: 'LISTING',
        targetId: listing.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Listing removed from marketplace.',
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to delete listing.' },
      { status: 500 }
    );
  }
}
