# DBU Connect — API Specification & Endpoint Catalog

All API endpoints follow REST conventions, expect and return JSON, and enforce server-side validation and authentication.

---

## 1. Authentication & Onboarding

### `POST /api/auth/verify-roster`
Pre-registration check to verify student eligibility without storing unverified passwords.
- **Request:**
  ```json
  {
    "email": "student.name@dbu.edu.et",
    "studentId": "DBU/14/0892"
  }
  ```
- **Success (200):**
  ```json
  {
    "eligible": true,
    "fullName": "Abebe Kebede",
    "department": "Computer Science",
    "faculty": "Computing and Informatics",
    "admissionYear": 2022
  }
  ```
- **Error (400/403):** Returns `eligible: false` and explanatory message.

### `POST /api/auth/register`
Atomically registers user, creates profile, claims roster record, and signs session cookie.
- **Request:**
  ```json
  {
    "email": "student.name@dbu.edu.et",
    "password": "StrongPassword2026!",
    "studentId": "DBU/14/0892",
    "displayName": "Abebe Kebede",
    "department": "Computer Science"
  }
  ```
- **Success (201):** Sets `dbu_session` cookie; returns sanitized user object.

### `POST /api/auth/login`
Authenticates credentials, verifies account is not suspended, and signs session cookie.
- **Request:**
  ```json
  {
    "email": "student.name@dbu.edu.et",
    "password": "StrongPassword2026!"
  }
  ```
- **Success (200):** Returns user and profile object; sets `dbu_session` cookie.

### `POST /api/auth/logout`
Clears session cookie (`dbu_session`).

### `GET /api/auth/me`
Retrieves currently authenticated session user and profile.

---

## 2. Campus Feed & Social Posts

### `GET /api/posts`
- **Query Params:** `limit` (default 20, max 50), `cursor` (pagination id)
- **Response (200):** Array of posts with author info, like count, comment count, and `hasLiked` boolean.

### `POST /api/posts`
- **Headers:** `Cookie: dbu_session=...`
- **Request:**
  ```json
  {
    "content": "Announcement regarding exam schedules...",
    "visibility": "CAMPUS",
    "mediaUrl": "https://example.com/image.jpg"
  }
  ```

### `POST /api/posts/[id]/like`
Toggles like status. Database constraint `@@unique([postId, userId])` prevents duplicate likes.
- **Response (200):** `{ "success": true, "isLiked": true, "likeCount": 12 }`

### `GET /api/posts/[id]/comments`
Returns chronologically ordered comments for post `[id]`.

### `POST /api/posts/[id]/comments`
Adds a comment and creates a notification for the post author.
- **Request:** `{ "content": "Thank you for the update!" }`

### `POST /api/posts/[id]/share`
Increments atomic share count upon real share event.

---

## 3. Direct Messaging

### `GET /api/messages/conversations`
Lists conversations for the logged-in user with latest message snippet and unread message count.

### `POST /api/messages/conversations`
Starts or finds direct conversation with `recipientId`.

### `GET /api/messages/conversations/[id]`
Returns message history. **Enforces participant authorization** (non-members receive 403 Forbidden). Automatically marks conversation as read.

### `POST /api/messages/conversations/[id]`
Persists message and dispatches activity notification to recipient.

---

## 4. Campus Marketplace

### `GET /api/marketplace/listings`
- **Query Params:** `q` (keyword), `category`, `condition`, `status` (`ACTIVE`)
- **Response (200):** Array of verified listings with seller profile and price in ETB.

### `POST /api/marketplace/listings`
Publishes new listing. Seller ID is extracted from verified session.
- **Request:**
  ```json
  {
    "title": "Casio fx-991EX Calculator",
    "description": "Like-new scientific calculator for calculus and physics.",
    "category": "Electronics",
    "price": 800,
    "condition": "Like New",
    "location": "Main Campus Library"
  }
  ```

### `POST /api/marketplace/listings/[id]/save`
Toggles saving/bookmarking a listing for current user.

### `GET /api/marketplace/saved`
Retrieves private bookmarked listings for authenticated user.

---

## 5. Administrative & Registrar Workflows

### `GET /api/admin/stats`
Returns system totals (users, posts, listings, pending reports, claimed roster count). Requires `ADMIN`, `REGISTRAR`, or `SUPER_ADMIN`.

### `GET /api/admin/roster`
Queries official roster records with search and claim status filters.

### `POST /api/admin/roster/import`
Batch imports student roster entries with row validation and reconciliation.
- **Request:**
  ```json
  [
    {
      "studentId": "DBU/17/0101",
      "universityEmail": "student@dbu.edu.et",
      "fullName": "Student Name",
      "department": "Civil Engineering",
      "faculty": "Technology",
      "admissionYear": 2025,
      "eligibilityStatus": "ELIGIBLE"
    }
  ]
  ```

### `PUT /api/admin/users`
Updates user status (`ACTIVE`, `SUSPENDED`, `DISABLED`) or elevates role (Super Admin only).

### `GET /api/admin/audit-logs`
Returns chronological audit log entries.

---

## 6. Menilik AI Assistant

### `POST /api/menilik/ask`
Queries the grounded university policy RAG engine.
- **Request:** `{ "question": "What is the minimum GPA scale at DBU?" }`
- **Response (200):**
  ```json
  {
    "question": "What is the minimum GPA scale at DBU?",
    "answer": "According to official DBU policy (Debre Berhan University Senate Legislation, Article 42)...",
    "isGrounded": true,
    "citations": [
      {
        "documentTitle": "Debre Berhan University Senate Legislation - Academic Policy",
        "section": "Article 42: Academic Standing and Grading System",
        "category": "ACADEMIC"
      }
    ],
    "disclaimer": "Menilik AI answers are grounded in official Debre Berhan University legislation..."
  }
  ```
