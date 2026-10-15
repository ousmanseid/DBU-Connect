import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to save listings.' },
        { status: 401 }
      );
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!listing || listing.status === 'REMOVED') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Listing not found.' },
        { status: 404 }
      );
    }

    const existingSave = await prisma.savedListing.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: listing.id,
        },
      },
    });

    let isSaved = false;

    if (existingSave) {
      await prisma.savedListing.delete({
        where: { id: existingSave.id },
      });
      isSaved = false;
    } else {
      await prisma.savedListing.create({
        data: {
          userId: user.id,
          listingId: listing.id,
        },
      });
      isSaved = true;
    }

    return NextResponse.json({
      success: true,
      isSaved,
      message: isSaved ? 'Listing saved to your bookmarks.' : 'Listing removed from saved items.',
    });
  } catch (error) {
    console.error('Save listing error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to save listing.' },
      { status: 500 }
    );
  }
}
