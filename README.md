# 🎓 DBU Connect

### A University-Focused Social Networking & Student Services Platform
**Institution:** Debre Berhan University (DBU), Ethiopia  
**Project Owner:** Ousman Seid  
**Repository:** [https://github.com/ousmanseid/DBU-Connect](https://github.com/ousmanseid/DBU-Connect)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-44%20passed-success.svg)]()
[![Framework](https://img.shields.io/badge/Next.js-14%20App%20Router-black.svg)]()
[![ORM](https://img.shields.io/badge/Prisma-5.22-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)]()

---

## 📌 Executive Summary

**DBU Connect** is a complete, secure, university-tailored web application built to centralize communication, campus commerce, and academic information access for the Debre Berhan University community.

The platform provides:
1. **Institutional Eligibility Verification:** Account creation is strictly gated by official Registrar student roster records and institutional emails (`@dbu.edu.et`).
2. **Campus Social Feed & Video Playback:** Home feed with personalized student welcome, post reactions (likes with DB-level duplicate prevention), threaded comments, share counters, and responsive HTML5 video playback.
3. **Dedicated Post Creation (`/create`):** Independent content-creation workflow supporting text posts, direct photo uploads, and video uploads with preview, drag-and-drop, and upload progress.
4. **Student Directory & Discovery (`/students`):** Privacy-preserving student search by name and department, dynamic connection status, and direct profile navigation.
5. **Full Friend-Request Lifecycle:** Relationship management (`Add Friend`, `Request Sent`, `Accept Request`, `Connected`, `Cancel`, `Remove Friend`) synchronized across directory, profiles, and inbox.
6. **3-Tab Campus Inbox (`/inbox`):** Unified communication center featuring direct 1-on-1 messages, incoming/outgoing friend requests with one-click actions, and campus activity notifications.
7. **Peer-to-Peer Campus Marketplace (`/marketplace`):** Secure student exchange for textbooks, dorm gear, calculators, and electronics with category filtering, search, and bookmarks.
8. **Menilik AI University Assistant (`/menilik`):** Retrieval-Augmented Generation (RAG) assistant grounded in official DBU senate legislation and student handbooks, complete with section citations and uncertainty detection.
9. **Administrative & Registrar Desk (`/admin`):** Role-based dashboards for Super Admins, Campus Admins, and Registrars with batch roster reconciliation and audit logging.

---

## 🚀 Key Modules & Implemented Features

### 🧭 1. Unified Navigation Structure
- **Main Destinations:** `Home` (`/`), `Create` (`/create`), `Inbox` (`/inbox`), `Marketplace` (`/marketplace`), `Menilik AI` (`/menilik`), `Profile` (`/profile`), and `Discover Students` (`/students`).
- **Responsive Layout:** Sleek desktop sidebar with university crest and user badge; ergonomic mobile bottom navigation with quick-action center Create button.
- **Global Header:** Active student search bar with instant directory query and notifications drawer.

### 📸 2. Real Image & Video Uploads (`/api/upload`)
- **Direct Device Selection:** Students upload images (`.jpg`, `.png`, `.webp`, `.gif` up to 10MB) and videos (`.mp4`, `.webm`, `.mov` up to 50MB) directly from their phone or computer.
- **Server-Side Security:** Validates binary magic byte headers (e.g. PNG signature `89 50 4E 47`, JPEG `FF D8 FF`, MP4 `ftyp`) to prevent MIME and extension spoofing.
- **Safe Persistence:** Media files receive cryptographically random UUID names and are stored securely under `public/uploads/`.
- **In-Feed HTML5 Video Player:** Feed posts detect uploaded videos and render responsive video players with playback controls and metadata preloading.

### 👥 3. Student Search & Friend Request Lifecycle
- **Searchable Directory:** Filter verified students across all 15 academic departments with bounded pagination.
- **Privacy Enforcement:** Internal institutional IDs, private university emails, and phone numbers are strictly stripped from search endpoints.
- **Friend Request State Machine:** Supports real-time database state transitions (`Add Friend` -> `Request Sent` -> `Accept/Decline` -> `Connected` -> `Cancel / Disconnect`) with canonical pair indexing in `Friendship`.

### 🌐 2. Campus Social Feed
- **Post Composer:** Publish text posts with optional media attachments and visibility controls (*Campus Wide* vs *Friends Only*).
- **Relational Integrity:** Unique constraints (`@@unique([postId, userId])`) prevent duplicate likes.
- **Comments & Sharing:** Threaded discussion comments with live counters and verified timestamps.

### 🛍️ 3. Campus Marketplace
- **Student Commerce:** Filter listings by category (*Textbooks*, *Electronics*, *Dorm Gear*, *Clothing*, *Services*).
- **Search & Save:** Live search bar by title keyword and bookmarking saved listings.
- **Seller Contact:** Instant direct messaging link to the seller.

### ✉️ 4. Direct Messaging & Inbox
- **1-on-1 Conversations:** Persistent message history and unread counters.
- **Strict Authorization:** Non-members are denied access at the API level (returns `403 Forbidden`).

### 🤖 5. Menilik AI University Assistant
- **RAG Architecture:** Grounded in official DBU Senate Legislation, Student Housing Curfew rules, and Registrar clearance procedures.
- **Truthful Citations:** Every answer cites document titles and article numbers.
- **Safety Defenses:** Neutralizes prompt-injection attempts and communicates uncertainty when questions are outside approved sources.

### 🛡️ 6. Administration, Registrar Tools & Audit Logs
- **Registrar Desk:** Batch roster import with row-by-row validation, duplicate detection, and reconciliation.
- **Super Admin Governance:** Role assignments, user status management (suspend/reactivate), and a chronological audit log.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend & Backend** | **Next.js 14 (App Router)** | Full-stack React 18 application with server-side routes |
| **Language** | **TypeScript 5.6** | End-to-end type safety |
| **Styling** | **Vanilla CSS Design System** | Custom DBU Navy & Gold palette, glassmorphism, responsive shell |
| **Database & ORM** | **Prisma 5.22 / Relational** | SQLite (zero-config local dev & tests) / PostgreSQL (production) |
| **Authentication** | **Bcryptjs & Jose** | Secure password hashing & stateless signed JWT session cookies |
| **Validation** | **Zod 3.23** | Strict server-side request validation |
| **Testing** | **Vitest 2.1** | Unit, integration, authorization, and RAG retrieval tests |

---

## ⚙️ Installation & Local Setup

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node `v22.21`)
- npm `v10+`

### Step 1: Clone the Repository
```bash
git clone https://github.com/ousmanseid/DBU-Connect.git
cd DBU-Connect
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
```bash
cp .env.example .env
```
*(Default settings work out-of-the-box with local SQLite `file:./dev.db`)*

### Step 4: Initialize Database & Schema
```bash
npx prisma db push
```

### Step 5: Seed Synthetic Demonstration Data
```bash
npm run db:seed
```

### Step 6: Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Running the Automated Test Suite

DBU Connect includes **34 automated unit and integration tests** verifying authentication, authorization guards, unique constraints, and Menilik AI retrieval:

```bash
npm test
```

### Test Coverage Highlights
- `auth.test.ts`: Password hashing, token tampering defense, role checking.
- `validation.test.ts`: `@dbu.edu.et` regex validation, password rules, post length limits.
- `registration-flow.test.ts`: Official roster eligibility check, atomic roster claim, duplicate prevention.
- `social-flow.test.ts`: Social post lifecycle, duplicate like prevention, canonical friendships.
- `messaging-flow.test.ts`: 1-on-1 messaging, conversation membership authorization.
- `marketplace-flow.test.ts`: Listing publishing, search filters, bookmarking.
- `admin-flow.test.ts`: Registrar batch import reconciliation, privilege escalation guards.
- `menilik-ai.test.ts`: Prompt injection neutralization, grounded citations, uncertainty handling.

---

## 👥 Demonstration Accounts

All demo accounts share the password: **`DBUConnect2026!`**

| Role | University Email | Name |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@dbu.edu.et` | Dr. Girma Worku |
| **Registrar** | `registrar@dbu.edu.et` | Almaz Tessema |
| **Campus Admin** | `admin@dbu.edu.et` | Mulugeta Assefa |
| **Student A** | `abebe.kebede@dbu.edu.et` | Abebe Kebede |
| **Student B** | `bethlehem.haile@dbu.edu.et` | Bethlehem Haile |
| **Student C** | `yared.getachew@dbu.edu.et` | Yared Getachew |

*(Tip: On the `/login` page, you can click any persona in the **One-Click Evaluation Switcher** for instant sign-in).*

---

## 📚 Complete Project Documentation

- **[System Architecture (ARCHITECTURE.md)](docs/ARCHITECTURE.md):** Modular monolith design, security principles, RBAC matrix, and RAG retrieval.
- **[Relational Data Model (DATA_MODEL.md)](docs/DATA_MODEL.md):** ERD, table definitions, foreign keys, unique constraints, and indexes.
- **[API Specification (API.md)](docs/API.md):** Comprehensive catalog of all REST endpoints, schemas, and status codes.
- **[Demonstration Guide (DEMO_GUIDE.md)](docs/DEMO_GUIDE.md):** Step-by-step evaluator script and reset procedures.
- **[Presentation Slides Blueprint (PRESENTATION_SLIDES.md)](docs/PRESENTATION_SLIDES.md):** 10-slide presentation outline for academic defense.
- **[Production Deployment Runbook (DEPLOYMENT.md)](docs/DEPLOYMENT.md):** PostgreSQL setup, backup strategies, RTO/RPO, and monitoring.
- **[Contributing Guidelines (CONTRIBUTING.md)](CONTRIBUTING.md):** Git workflow and Conventional Commit standards.

---

## 📄 License & Community
Built for the **Debre Berhan University** community.  
Project Owner: **Ousman Seid**
