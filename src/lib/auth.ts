import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './db';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'dbu-connect-dev-super-secret-key-32-chars-min'
);

export const COOKIE_NAME = 'dbu_session';

export interface UserSessionPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifySessionToken(token);
    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      profile: user.profile,
    };
  } catch (error) {
    return null;
  }
}

export const ROLES = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
  REGISTRAR: 'REGISTRAR',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export function hasRole(currentRole: string, allowedRoles: UserRole[]): boolean {
  if (currentRole === ROLES.SUPER_ADMIN) return true; // Super Admin has platform-level access
  return allowedRoles.includes(currentRole as UserRole);
}
