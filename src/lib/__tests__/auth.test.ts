import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, hasRole, ROLES } from '../auth';

describe('Auth & Session Security Tests', () => {
  it('should hash a password and verify it correctly', async () => {
    const raw = 'SecureDbuPassword2026!';
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    expect(hashed.startsWith('$2')).toBe(true);

    const isValid = await verifyPassword(raw, hashed);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', hashed);
    expect(isInvalid).toBe(false);
  });

  it('should generate and verify signed session JWT tokens', async () => {
    const payload = {
      userId: 'usr_test_123',
      email: 'abebe.kebede@dbu.edu.et',
      role: 'STUDENT',
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe(payload.role);
  });

  it('should reject tampered or invalid session tokens', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';
    const result = await verifySessionToken(fakeToken);
    expect(result).toBeNull();
  });

  it('should enforce role-based access checks properly', () => {
    expect(hasRole(ROLES.STUDENT, [ROLES.STUDENT])).toBe(true);
    expect(hasRole(ROLES.STUDENT, [ROLES.ADMIN])).toBe(false);
    expect(hasRole(ROLES.REGISTRAR, [ROLES.REGISTRAR, ROLES.ADMIN])).toBe(true);
    // Super Admin should inherit access
    expect(hasRole(ROLES.SUPER_ADMIN, [ROLES.ADMIN])).toBe(true);
    expect(hasRole(ROLES.SUPER_ADMIN, [ROLES.REGISTRAR])).toBe(true);
  });
});
