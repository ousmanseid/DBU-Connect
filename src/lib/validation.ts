import { z } from 'zod';

export const DBU_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@dbu\.edu\.et$/i;

// 1. Authentication Schemas
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .refine((val) => DBU_EMAIL_REGEX.test(val), {
      message: 'Registration requires an official Debre Berhan University email (@dbu.edu.et)',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password is too long'),
  studentId: z
    .string()
    .min(4, 'Institutional student ID is required (e.g., DBU/14/0892)')
    .max(30),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name cannot exceed 50 characters'),
  department: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// 2. Post & Comment Schemas
export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content cannot be empty')
    .max(3000, 'Post content exceeds maximum length of 3000 characters'),
  visibility: z.enum(['CAMPUS', 'FRIENDS_ONLY']).default('CAMPUS'),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  mediaType: z.enum(['IMAGE', 'DOCUMENT']).optional(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

// 3. Friend Request Schemas
export const friendRequestActionSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
});

// 4. Direct Message Schemas
export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
});

// 5. Marketplace Listing Schemas
export const marketplaceCategories = [
  'Textbooks',
  'Electronics',
  'Dorm Gear',
  'Clothing',
  'Services',
  'Other',
] as const;

export const marketplaceConditions = [
  'Brand New',
  'Like New',
  'Good',
  'Fair',
] as const;

export const createListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Listing title must be at least 3 characters')
    .max(120, 'Listing title cannot exceed 120 characters'),
  description: z
    .string()
    .min(10, 'Please provide a descriptive explanation (minimum 10 characters)')
    .max(3000, 'Description cannot exceed 3000 characters'),
  category: z.enum(marketplaceCategories, {
    errorMap: () => ({ message: 'Please select a valid campus category' }),
  }),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .max(1000000, 'Price exceeds allowed maximum'),
  condition: z.enum(marketplaceConditions, {
    errorMap: () => ({ message: 'Please specify the item condition' }),
  }),
  imageUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().max(100).optional(),
});

// 6. Moderation & Report Schemas
export const createReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'LISTING', 'USER']),
  targetId: z.string().min(1, 'Target ID is required'),
  reason: z.enum([
    'HARASSMENT',
    'SPAM_OR_SCAM',
    'MISINFORMATION',
    'INAPPROPRIATE_CONTENT',
    'OTHER',
  ]),
  details: z.string().max(1000).optional(),
});

// 7. Registrar Roster Import Schema
export const rosterRowSchema = z.object({
  studentId: z.string().min(3),
  universityEmail: z.string().email().refine((val) => DBU_EMAIL_REGEX.test(val)),
  fullName: z.string().min(2),
  department: z.string().min(2),
  faculty: z.string().min(2),
  admissionYear: z.number().int().min(2010).max(2035),
  eligibilityStatus: z.enum(['ELIGIBLE', 'PENDING_REVIEW', 'REVOKED']).default('ELIGIBLE'),
});

// 8. Admin Invitation Schema
export const inviteAdminSchema = z.object({
  email: z.string().email().refine((val) => DBU_EMAIL_REGEX.test(val), {
    message: 'Institutional email is required for staff invitations',
  }),
  role: z.enum(['ADMIN', 'REGISTRAR']),
});
