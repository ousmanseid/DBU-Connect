import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createListingSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const condition = searchParams.get('condition') || '';
    const status = searchParams.get('status') || 'ACTIVE';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const cursor = searchParams.get('cursor');

    const whereClause: any = {
      status,
      ...(category ? { category } : {}),
      ...(condition ? { condition } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    };

    const listings = await prisma.marketplaceListing.findMany({
      where: whereClause,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                department: true,
                phone: true,
              },
            },
          },
        },
        savedBy: user ? { where: { userId: user.id } } : false,
      },
    });

    let nextCursor: string | null = null;
    let items = listings;
    if (listings.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id || null;
    }

    const formattedListings = items.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      category: l.category,
      price: l.price,
      currency: l.currency,
      condition: l.condition,
      status: l.status,
      imageUrl: l.imageUrl,
      location: l.location || 'DBU Main Campus',
      createdAt: l.createdAt,
      seller: {
        id: l.seller.id,
        displayName: l.seller.profile?.displayName || 'DBU Student',
        avatarUrl: l.seller.profile?.avatarUrl || null,
        department: l.seller.profile?.department || 'Debre Berhan University',
        contactEmail: l.seller.email,
        phone: l.seller.profile?.phone || null,
      },
      isSaved: user && Array.isArray(l.savedBy) ? l.savedBy.length > 0 : false,
    }));

    return NextResponse.json({
      listings: formattedListings,
      nextCursor,
    });
  } catch (error) {
    console.error('Fetch marketplace listings error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to load marketplace listings.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to create a marketplace listing.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createListingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: validated.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const newListing = await prisma.marketplaceListing.create({
      data: {
        sellerId: user.id,
        title: validated.data.title.trim(),
        description: validated.data.description.trim(),
        category: validated.data.category,
        price: validated.data.price,
        condition: validated.data.condition,
        imageUrl: validated.data.imageUrl || null,
        location: validated.data.location?.trim() || 'DBU Main Campus',
        status: 'ACTIVE',
      },
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

    return NextResponse.json(
      {
        success: true,
        message: 'Listing published to DBU Campus Marketplace.',
        listing: {
          id: newListing.id,
          title: newListing.title,
          description: newListing.description,
          category: newListing.category,
          price: newListing.price,
          currency: newListing.currency,
          condition: newListing.condition,
          status: newListing.status,
          imageUrl: newListing.imageUrl,
          location: newListing.location,
          createdAt: newListing.createdAt,
          seller: {
            id: newListing.seller.id,
            displayName: newListing.seller.profile?.displayName || 'DBU Student',
            avatarUrl: newListing.seller.profile?.avatarUrl || null,
            department: newListing.seller.profile?.department || 'Debre Berhan University',
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to create marketplace listing.' },
      { status: 500 }
    );
  }
}
