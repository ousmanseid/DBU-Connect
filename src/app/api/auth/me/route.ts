import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
    },
  });
}
