# DBU Connect — Relational Data Model & Schema Specification

## 1. Entity-Relationship Overview

```
 ┌───────────────┐          1:1          ┌───────────────┐
 │ StudentRoster ├───────────────────────┤     User      │
 └───────┬───────┘                       └───┬───┬───┬───┘
         │                                   │   │   │
         │                               1:1 │   │   │ 1:N
         │                                   │   │   └──────────────┐
         ▼                                   ▼   ▼ 1:N              ▼
┌─────────────────┐                     ┌─────────┐   ┌────┐   ┌─────────┐
│ Claim Reference │                     │ Profile │   │Post│   │ Listing │
└─────────────────┘                     └─────────┘   └─┬──┘   └────┬────┘
                                                        │           │
                                              1:N ┌─────┴─────┐     │ 1:N
                                                  ▼           ▼     ▼
                                              ┌───────┐  ┌───────────────┐
                                              │Comment│  │ SavedListing  │
                                              └───────┘  │ Like (unique) │
                                                         └───────────────┘
```

---

## 2. Core Entities

### 2.1 User (`User`)
Represents authenticated university accounts.
- `id` (String, UUID Primary Key)
- `email` (String, Unique, Institutional `@dbu.edu.et`)
- `passwordHash` (String, Bcrypt hashed)
- `role` (Enum: `STUDENT`, `ADMIN`, `REGISTRAR`, `SUPER_ADMIN`)
- `status` (Enum: `ACTIVE`, `SUSPENDED`, `DISABLED`)
- `emailVerifiedAt` (DateTime, Nullable)
- `createdAt` / `updatedAt` (DateTime)

### 2.2 Student Roster (`StudentRoster`)
Official registrar student records used for institutional eligibility verification.
- `id` (String, UUID Primary Key)
- `studentId` (String, Unique, Institutional ID e.g., `DBU/14/0892`)
- `universityEmail` (String, Unique)
- `fullName` (String)
- `department` / `faculty` (String)
- `admissionYear` (Int)
- `eligibilityStatus` (Enum: `ELIGIBLE`, `PENDING_REVIEW`, `REVOKED`)
- `claimed` (Boolean, Default `false`)
- `claimedAt` (DateTime, Nullable)
- `claimedByUserId` (String, Unique Nullable, FK to `User`)
- `importBatchId` (String, Nullable)

### 2.3 Profile (`Profile`)
Public student profile information.
- `id` (String, UUID Primary Key)
- `userId` (String, Unique, FK to `User` on delete CASCADE)
- `displayName` (String)
- `bio` (String, Nullable)
- `avatarUrl` (String, Nullable)
- `department` (String, Nullable)
- `graduationYear` (Int, Nullable)
- `privacyLevel` (Enum: `PUBLIC`, `CAMPUS_ONLY`, `FRIENDS_ONLY`)

### 2.4 Social Post (`Post`)
- `id` (String, UUID Primary Key)
- `authorId` (String, FK to `User` on delete CASCADE)
- `content` (String, up to 3000 chars)
- `mediaUrl` (String, Nullable)
- `mediaType` (String, Nullable: `IMAGE`, `DOCUMENT`)
- `visibility` (Enum: `CAMPUS`, `FRIENDS_ONLY`)
- `status` (Enum: `ACTIVE`, `REMOVED`, `REPORTED`)
- `shareCount` (Int, Default `0`)
- `createdAt` / `updatedAt` (DateTime)

### 2.5 Post Like (`Like`)
- `id` (String, UUID Primary Key)
- `postId` (String, FK to `Post` on delete CASCADE)
- `userId` (String, FK to `User` on delete CASCADE)
- `createdAt` (DateTime)
- **Constraint:** `@@unique([postId, userId])` — Guarantees duplicate likes can never occur.

### 2.6 Post Comment (`Comment`)
- `id` (String, UUID Primary Key)
- `postId` (String, FK to `Post` on delete CASCADE)
- `authorId` (String, FK to `User` on delete CASCADE)
- `content` (String, up to 1000 chars)
- `status` (Enum: `ACTIVE`, `REMOVED`)
- `createdAt` / `updatedAt` (DateTime)

### 2.7 Canonical Friendship (`Friendship`)
- `id` (String, UUID Primary Key)
- `user1Id` (String) — Enforces `user1Id < user2Id` lexicographically
- `user2Id` (String)
- `createdAt` (DateTime)
- **Constraint:** `@@unique([user1Id, user2Id])` — Guarantees only one canonical record exists per peer connection.

### 2.8 Friend Request (`FriendRequest`)
- `id` (String, UUID Primary Key)
- `senderId` (String, FK to `User`)
- `receiverId` (String, FK to `User`)
- `status` (Enum: `PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`)
- **Constraint:** `@@unique([senderId, receiverId])`

### 2.9 Conversations & Messages (`Conversation`, `ConversationMember`, `Message`)
- `Conversation`: `id`, `type` (`DIRECT`), `updatedAt`
- `ConversationMember`: `conversationId`, `userId`, `lastReadAt`. **Constraint:** `@@unique([conversationId, userId])`
- `Message`: `id`, `conversationId`, `senderId`, `content`, `createdAt`

### 2.10 Campus Marketplace (`MarketplaceListing`, `SavedListing`)
- `MarketplaceListing`: `id`, `sellerId`, `title`, `description`, `category` (Textbooks, Electronics, Dorm Gear, Clothing, Services, Other), `price`, `currency` (ETB), `condition` (Brand New, Like New, Good, Fair), `location`, `status` (`ACTIVE`, `RESERVED`, `SOLD`, `REMOVED`)
- `SavedListing`: `userId`, `listingId`. **Constraint:** `@@unique([userId, listingId])`

### 2.11 Audit Log (`AuditLog`)
- `id` (String, UUID Primary Key)
- `actorId` (String, FK to `User`)
- `action` (String, e.g., `ROSTER_BATCH_IMPORT`, `USER_SUSPENDED`, `ROLE_ASSIGNED`)
- `targetType` / `targetId` (String)
- `details` (String / JSON metadata)
- `ipAddress` (String, Nullable)
- `createdAt` (DateTime)
