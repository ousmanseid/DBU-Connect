import { describe, it, expect } from 'vitest';
import { registerSchema, createPostSchema, createListingSchema } from '../validation';

describe('Validation Schema Tests', () => {
  it('should accept valid Debre Berhan University emails', () => {
    const validData = {
      email: 'student.name@dbu.edu.et',
      password: 'StrongPassword123!',
      studentId: 'DBU/14/0892',
      displayName: 'Abebe Kebede',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject non-institutional emails during registration', () => {
    const invalidData = {
      email: 'external.person@gmail.com',
      password: 'StrongPassword123!',
      studentId: 'DBU/14/0892',
      displayName: 'External User',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('@dbu.edu.et');
    }
  });

  it('should reject short passwords under 8 characters', () => {
    const invalidData = {
      email: 'student@dbu.edu.et',
      password: '123',
      studentId: 'DBU/14/0892',
      displayName: 'Abebe',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 8 characters');
    }
  });

  it('should validate social post content length', () => {
    expect(createPostSchema.safeParse({ content: '' }).success).toBe(false);
    expect(createPostSchema.safeParse({ content: 'Hello DBU campus!' }).success).toBe(true);
    expect(createPostSchema.safeParse({ content: 'a'.repeat(3001) }).success).toBe(false);
  });

  it('should validate marketplace listing price and condition', () => {
    const invalidListing = {
      title: 'Operating Systems Textbook',
      description: 'Used textbook for CS year 3 students in good condition.',
      category: 'Textbooks',
      price: -50, // Invalid negative price
      condition: 'Good',
    };

    const result = createListingSchema.safeParse(invalidListing);
    expect(result.success).toBe(false);
  });
});
