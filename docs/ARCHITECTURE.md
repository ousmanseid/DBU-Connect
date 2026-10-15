# DBU Connect — System Architecture & Design

## 1. Architectural Philosophy
DBU Connect is architected as a **modular monolith** built on Next.js 14 (App Router) and TypeScript. This design maximizes cohesion, simplifies end-to-end type safety, minimizes operational overhead, and eliminates distributed transaction complexity for an Ethiopian university deployment environment.

```
                    ┌──────────────────────────────────────────────┐
                    │               Client Devices                 │
                    │   (Desktop Browsers / Tablets / Mobiles)     │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTPS / TLS
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             Next.js Application Server                           │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                         Presentation & UI Layer                          │   │
│   │   • Responsive App Shell (Sidebar, Header, Mobile Bottom Nav)            │   │
│   │   • Feed Page (Post Composer, Comments, Live Likes)                      │   │
│   │   • Campus Marketplace (Filter Pills, Search, Booking Actions)           │   │
│   │   • Direct Messaging Inbox (Real-time Message History, Unread Badges)    │   │
│   │   • Student Profiles (Verified Credentials, My Posts, Bookmarks)         │   │
│   │   • Administrative & Registrar Desk (Roster Reconciliation, Audit Logs)  │   │
│   │   • Menilik AI Portal (Grounded Senate Legislation Q&A)                  │   │
│   └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                      │                                           │
│   ┌──────────────────────────────────▼───────────────────────────────────────┐   │
│   │                      Business Logic & Domain Layer                       │   │
│   │   • Authentication & Session Guards (JWT / HttpOnly Cookie / Bcrypt)     │   │
│   │   • Server-Side Validation (Strict Zod Schemas)                          │   │
│   │   • Role-Based Access Control (Student, Admin, Registrar, Super Admin)   │   │
│   │   • Menilik AI RAG Retrieval Engine (Deterministic Knowledge Matching)   │   │
│   │   • Audit Logging & Moderation Handlers                                  │   │
│   └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                      │                                           │
│   ┌──────────────────────────────────▼───────────────────────────────────────┐   │
│   │                   Data Access Layer (Prisma ORM)                         │   │
│   │   • Transactional Safety (`prisma.$transaction`)                         │   │
│   │   • Relational Integrity & Cascade Deletes                               │   │
│   │   • Database-Level Unique Constraints & Foreign Keys                     │   │
│   └──────────────────────────────────┬───────────────────────────────────────┘   │
└──────────────────────────────────────┼───────────────────────────────────────────┘
                                       │ SQL Connection Pool
                                       ▼
                    ┌──────────────────────────────────────────────┐
                    │            Relational Database               │
                    │   • Development / Testing: SQLite            │
                    │   • Production: Managed PostgreSQL           │
                    │     (Neon / Supabase / AWS RDS)              │
                    └──────────────────────────────────────────────┘
```

---

## 2. Security Architecture

### 2.1 Defense in Depth
1. **Server-Side Enforcement:** Frontend UI buttons are convenience controls; every protected operation enforces authentication and object-level permissions on the server.
2. **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using bcrypt (10 rounds).
3. **Stateless Session Management:** Signed, tamper-proof JSON Web Tokens (HS256) stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies (`dbu_session`).
4. **Institutional Identifier Protection:** Internal student IDs (`DBU/...`) and private university emails are restricted to registrar records and never exposed in public profile or student search queries.
5. **Database-Level Integrity Constraints:**
   - Likes enforce `@@unique([postId, userId])` to prevent duplicate likes.
   - Friendships enforce canonical sorting (`user1Id < user2Id`) with `@@unique([user1Id, user2Id])`.
   - Saved listings enforce `@@unique([userId, listingId])`.
   - Roster entries enforce `@@unique([studentId])` and `@@unique([universityEmail])`.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Action | Student | Admin | Registrar | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| **View Campus Feed & Posts** | ✅ | ✅ | ✅ | ✅ |
| **Publish Posts & Comments** | ✅ | ✅ | ✅ | ✅ |
| **Edit/Delete Own Posts** | ✅ | ✅ | ✅ | ✅ |
| **Moderate/Remove Others' Posts** | ❌ | ✅ | ❌ | ✅ |
| **Send/Receive Direct Messages** | ✅ | ✅ | ✅ | ✅ |
| **Publish Marketplace Listings** | ✅ | ✅ | ✅ | ✅ |
| **Query Menilik AI Assistant** | ✅ | ✅ | ✅ | ✅ |
| **View Registrar Roster Records** | ❌ | ❌ | ✅ | ✅ |
| **Execute Batch Roster Import** | ❌ | ❌ | ✅ | ✅ |
| **Suspend / Reactivate Users** | ❌ | ✅ | ❌ | ✅ |
| **Assign or Revoke Roles** | ❌ | ❌ | ❌ | ✅ |
| **Inspect System Audit Trail** | ❌ | ✅ | ❌ | ✅ |

---

## 4. Menilik AI RAG Architecture
Menilik AI operates using **Retrieval-Augmented Generation (RAG)** grounded exclusively in approved Debre Berhan University legislation:
1. **Document Ingestion:** Official university senate legislation, dormitory regulations, registrar guidelines, and student codes of conduct are divided into titled, numbered section chunks.
2. **Deterministic Token & Semantic Matching:** User queries are stripped of prompt injection attempts (`ignore instructions`, `system prompt`), tokenized, and matched against chunk keywords and section titles.
3. **Evidence Grounding:** If query relevance is below threshold, the assistant truthfully communicates uncertainty and suggests verified topics rather than hallucinating university policies.
4. **Citations:** Every generated response cites the exact document title and article number.
