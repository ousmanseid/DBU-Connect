# DBU Connect — Final Project Presentation Slides Blueprint

This outline corresponds directly to the 10-slide presentation recommended in Section 33 of the specification.

---

### Slide 1 — Title and Introduction
- **Title:** DBU Connect: A University-Focused Social Networking & Student Services Platform
- **Presenter:** Ousman Seid
- **Institution:** Debre Berhan University (DBU), Ethiopia
- **Department:** Computing & Informatics
- **Tagline:** Connecting Students • Sharing Ideas • Empowering Campus Commerce • Grounding Campus Knowledge

---

### Slide 2 — Problem Statement & University Motivation
- **Campus Communication Fragmentation:** Academic announcements and student discussions scattered across unmoderated, unverified third-party groups.
- **Student Commerce Risks:** Buying and selling textbooks, calculators, and dorm gear without campus identity verification leads to scams and trust deficits.
- **Institutional Information Discovery:** Students struggle to locate authoritative answers to academic standing, dormitory curfews, course add/drop deadlines, and graduation clearance rules.
- **Need for University Governance:** Separation of student roles from delegated administrators and registrar officers with audited actions.

---

### Slide 3 — Project Objectives & Scope
- **General Objective:** Design and develop a secure, responsive, university-tailored web platform supporting student networking, marketplace activities, administrative workflows, and AI policy guidance.
- **Specific Objectives:**
  - Registrar eligibility verification using official student roster records (`@dbu.edu.et`).
  - Social interactions with database-enforced integrity (duplicate-like prevention, canonical friendships).
  - Private 1-on-1 messaging with participant-level authorization guards.
  - Safe campus marketplace without taking custody of funds.
  - Menilik AI: RAG assistant grounded in official university senate legislation.
- **Deferred to Later Phases:** Native mobile apps, automated video transcoding, third-party payment gateways.

---

### Slide 4 — System Requirements & Architecture
- **Architecture:** Modular monolith designed for maintainability and operational efficiency.
- **Key Modules:**
  1. *Authentication & Eligibility:* Roster claims, password hashing (bcrypt), signed JWT cookies.
  2. *Social Feed:* Feed pagination, post composer, like/comment counts, live shares.
  3. *Campus Marketplace:* Search, category filtering, bookmarking, seller contact.
  4. *Direct Messaging:* 1-on-1 conversations, unread counters, access authorization.
  5. *Administration Desk:* Super Admin role delegation, Registrar roster reconciliation, moderation queue, audit logs.
  6. *Menilik AI:* Deterministic keyword & semantic retrieval engine, citations, uncertainty detection.

---

### Slide 5 — Database Design & Relational Constraints
- **Relational Integrity by Design:**
  - `Like`: `@@unique([postId, userId])` prevents duplicate likes even under concurrent requests.
  - `Friendship`: Canonical ordering (`user1Id < user2Id`) with `@@unique([user1Id, user2Id])`.
  - `SavedListing`: `@@unique([userId, listingId])` prevents bookmark duplication.
  - `StudentRoster`: Unique institutional IDs and university emails.
- **Audit Trails:** Centralized `AuditLog` records actor ID, action, target resource, and JSON metadata.

---

### Slide 6 — Technologies Used & Technical Decisions
- **Frontend & App Shell:** Next.js 14 (App Router), TypeScript, React 18.
- **Styling & UI System:** Curated Vanilla CSS with DBU Navy & Gold palette, glassmorphism, responsive desktop sidebar & mobile navigation.
- **Data Access:** Prisma ORM for relational queries and migrations.
- **Security & Validation:** Bcryptjs, Jose (JWT), Zod for server-side request validation.
- **Testing Runner:** Vitest for automated unit and integration tests.

---

### Slide 7 — Live Demonstration Walkthrough
- **Demonstration Flow:**
  1. *Student Onboarding:* Verify unclaimed eligible student (`kalkidan.alemu@dbu.edu.et`, `DBU/15/0781`).
  2. *Social Feed:* Publish post, like/unlike toggle, comment submission, share counter.
  3. *Messaging:* Send 1-on-1 message between Student A and Student B; show unread counters.
  4. *Marketplace:* Category filtering, keyword search, saving an item.
  5. *Menilik AI:* Ask about GPA warning thresholds and dormitory curfews; show official policy citations and uncertainty handling for off-topic queries.
  6. *Administrative Desk:* Registrar batch roster import and Super Admin audit log review.

---

### Slide 8 — Automated Testing & Security Verification
- **Test Suite Results:** **34 Automated Tests Passed** across 8 test suites:
  - `auth.test.ts`: Password hashing and signed session token verification.
  - `validation.test.ts`: Strict `@dbu.edu.et` regex validation and schema constraints.
  - `registration-flow.test.ts`: Atomic roster claiming and duplicate claim prevention.
  - `social-flow.test.ts`: Post lifecycle, like duplicate prevention, and canonical friendships.
  - `messaging-flow.test.ts`: Participant authorization (non-members denied access).
  - `marketplace-flow.test.ts`: Listing creation, search filters, and bookmarking.
  - `admin-flow.test.ts`: Batch roster reconciliation and privilege escalation prevention.
  - `menilik-ai.test.ts`: Neutralization of prompt injections and citation accuracy.

---

### Slide 9 — Known Limitations & Future Work
- **Initial Scope Boundaries:**
  - In-app notification delivery (external SMTP push optional).
  - Peer-to-peer campus marketplace (does not process financial transactions or hold funds).
  - Video uploads deferred until cloud transcoding pipeline is provisioned.
- **Future Improvements:**
  - Departmental student clubs and project groups.
  - Integration with university registrar SIS via REST webhooks.
  - Native Android/iOS applications via React Native.
  - Approved third-party mobile payment integration (Telebirr / CBE Birr).

---

### Slide 10 — Conclusion & Acknowledgments
- **Project Contribution:** DBU Connect delivers a real, fully implemented, secure, university-tailored digital platform ready for student pilot testing.
- **Key Takeaways:** Real relational data persistence, server-side authorization on every endpoint, zero public exposure of private student records, and transparent, citation-grounded AI assistance.
- **Special Thanks:** Debre Berhan University, Faculty of Computing & Informatics, and Project Supervisor.
- **Questions & Open Discussion.**
