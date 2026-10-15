# DBU Connect — Demonstration & Presentation Guide

This guide provides a step-by-step walkthrough to convincingly demonstrate **DBU Connect** to university supervisors, evaluators, faculty members, and student leadership.

---

## 1. Quick Demonstration Credentials

All demonstration accounts use the password: **`DBUConnect2026!`**

| Persona | Role | University Email | Key Demonstration Capability |
| :--- | :--- | :--- | :--- |
| **Dr. Girma Worku** | Super Admin | `superadmin@dbu.edu.et` | Platform administration, role assignments, audit logs |
| **Almaz Tessema** | Registrar Officer | `registrar@dbu.edu.et` | Official student roster import, reconciliation & eligibility |
| **Mulugeta Assefa** | Campus Admin | `admin@dbu.edu.et` | Content moderation queue, student account suspensions |
| **Abebe Kebede** | Student A (4th Yr CS) | `abebe.kebede@dbu.edu.et` | Social posting, messaging, marketplace seller |
| **Bethlehem Haile** | Student B (3rd Yr SE)| `bethlehem.haile@dbu.edu.et`| Liking, commenting, messaging, saving listings |
| **Yared Getachew** | Student C (2nd Yr ECE)| `yared.getachew@dbu.edu.et` | Marketplace listing, campus questions |

### Unclaimed Synthetic Student for Live Onboarding Demonstration
- **Student Name:** Kalkidan Alemu
- **Institutional Email:** `kalkidan.alemu@dbu.edu.et`
- **Student ID:** `DBU/15/0781`
- **Department:** Information Systems

---

## 2. Step-by-Step Demonstration Script

### Step 1: Project Overview & Vision (1 Minute)
1. Open the application at `http://localhost:3000`.
2. Explain the core objective: *“Debre Berhan University students currently face fragmented communication across unverified channels. DBU Connect centralizes social networking, peer-to-peer campus commerce, and instant policy guidance through our AI assistant, Menilik, all guarded by institutional registrar eligibility.”*

### Step 2: Student Roster Eligibility & Onboarding (2 Minutes)
1. Navigate to `/register`.
2. Enter a non-DBU email (e.g. `test@gmail.com`) to show the server rejecting non-institutional domains.
3. Enter the demo student credentials:
   - Email: `kalkidan.alemu@dbu.edu.et`
   - Student ID: `DBU/15/0781`
4. Click **Verify Student Eligibility**. The system matches official Registrar records and displays:
   - Department: *Information Systems*
   - Faculty: *Computing and Informatics*
5. Complete account setup with a display name and password.
6. Highlight that internal institutional student IDs are **never exposed publicly** in profiles or search queries.

### Step 3: Social Feed & Interaction Integrity (2 Minutes)
1. Sign in as **Abebe Kebede** (`abebe.kebede@dbu.edu.et`).
2. Show the active campus feed containing academic announcements and student club activities.
3. Write a new post: *"Excited for the campus tech exhibition this Friday!"* and publish.
4. Click the **Heart (Like)** icon. Click it again to show unlike.
5. Emphasize that the database schema enforces a unique constraint on `(postId, userId)`: duplicate likes are mathematically impossible even under race conditions.
6. Open comments on a post and submit a response.
7. Click **Share** to demonstrate that the share counter only increments upon real share actions.

### Step 4: Direct Messaging & Authorization Protection (2 Minutes)
1. Click **Inbox** (`/inbox`).
2. Show the existing 1-on-1 conversation between Abebe and Bethlehem.
3. Send a message: *"I will be at the library reading room."*
4. Explain the security architecture:
   - Only authorized conversation members can read messages.
   - Any external user attempting to access `GET /api/messages/conversations/[id]` receives a **403 Forbidden** error.

### Step 5: Campus Marketplace (2 Minutes)
1. Navigate to **Marketplace** (`/marketplace`).
2. Demonstrate filtering items by category pills (*Textbooks*, *Electronics*, *Dorm Gear*, *Services*).
3. Search for *"Calculator"* or *"Textbook"* using the search bar.
4. Click the **Bookmark** icon to save an item to personal bookmarks.
5. Click **Post New Listing** and show the validation rules (title, category, positive price in ETB, condition).
6. Note the safety design: The initial marketplace connects student buyers and sellers directly on campus without taking custody of student funds or advertising false payment guarantees.

### Step 6: Menilik AI University Policy Assistant (2 Minutes)
1. Navigate to **Menilik AI** (`/menilik`).
2. Click the sample prompt: *"What is the minimum GPA scale and academic warning threshold?"*
3. Observe Menilik's response:
   - Details the 4.0 scale and 1.75 warning threshold.
   - Cites the exact official source: *Debre Berhan University Senate Legislation, Article 42*.
4. Click the prompt: *"What are the night curfew hours for campus dormitories?"*
   - Cites 10:00 PM weekdays and 11:00 PM weekends (*DBU Student Services Directorate Housing Regulations*).
5. Type an off-topic question: *"What is the secret recipe for making injera on campus?"*
   - Observe Menilik's truthful response: communicates that no approved university document covers this and suggests verified academic questions instead of hallucinating.

### Step 7: Administrative & Registrar Workflows (2 Minutes)
1. Log out and sign in as **Almaz Tessema (Registrar)** (`registrar@dbu.edu.et`).
2. Open the **Admin Desk** (`/admin`).
3. Click **Registrar Roster Import**:
   - Review the official student eligibility roster table.
   - Show the batch JSON/CSV reconciliation tool.
   - Reconcile a batch of student records.
   - Emphasize the core policy: missing students from a new import are **never automatically disabled or deleted**.
4. Log in as **Dr. Girma Worku (Super Admin)** (`superadmin@dbu.edu.et`):
   - Review platform KPIs (total users, active posts, claimed roster rate).
   - Show user status management (suspend/reactivate).
   - Review the complete system audit trail recording every administrative event.

---

## 3. How to Reset Demo Data Between Presentations
To return the database to the clean demonstration state at any time, run:
```bash
npm run db:seed
```
This takes approximately 3 seconds and guarantees consistent, reproducible demonstration data.

---

## 4. Offline Presentation Backup Plan
If internet connectivity is unstable during evaluation:
1. The application runs **100% locally** via Next.js and Prisma SQLite (`dev.db`).
2. No external cloud dependencies or internet access are required for the core application, Menilik AI local RAG, or authentication.
