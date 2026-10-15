import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const saved = await prisma.savedListing.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            seller: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const activeListings = saved
      .filter((s) => s.listing.status !== 'REMOVED')
      .map((s) => ({
        id: s.listing.id,
        title: s.listing.title,
        description: s.listing.description,
        category: s.listing.category,
        price: s.listing.price,
        currency: s.listing.currency,
        condition: s.listing.condition,
        status: s.listing.status,
        imageUrl: s.listing.imageUrl,
        location: s.listing.location,
        savedAt: s.createdAt,
        seller: {
          id: s.listing.seller.id,
          displayName: s.listing.seller.profile?.displayName || 'DBU Student',
          avatarUrl: s.listing.seller.profile?.avatarUrl || null,
          department: s.listing.seller.profile?.department || 'Debre Berhan University',
        },
      }));

    return NextResponse.json({ savedListings: activeListings });
  } catch (error) {
    console.error('Fetch saved listings error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve saved listings.' },
      { status: 500 }
    );
  }
}
