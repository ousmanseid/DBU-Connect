# DBU Connect — Production Deployment & Operational Runbook

## 1. Production Hosting & Infrastructure Overview
DBU Connect is designed to run in modern server or serverless Node.js environments (Vercel, Docker on Ubuntu VM, or AWS/DigitalOcean container apps) connected to a managed PostgreSQL database.

---

## 2. PostgreSQL Configuration

In `prisma/schema.prisma`, update the datasource provider for production:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

In `.env` or deployment environment variables, configure the PostgreSQL connection string:
```env
DATABASE_URL="postgresql://dbu_admin:SecurePassword123!@db.dbu.edu.et:5432/dbu_connect?schema=public&sslmode=require"
```

Apply database migrations:
```bash
npx prisma migrate deploy
```

---

## 3. Environment Variables for Production

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Listening server port | `3000` |
| `NEXT_PUBLIC_APP_URL` | Canonical application URL | `https://connect.dbu.edu.et` |
| `DATABASE_URL` | Managed PostgreSQL connection string | `postgresql://...` |
| `SESSION_SECRET` | 32+ character cryptographically random string | `openssl rand -base64 32` |
| `ALLOWED_EMAIL_DOMAIN` | Allowed institutional email domain | `@dbu.edu.et` |
| `MENILIK_AI_PROVIDER` | AI provider mode | `local-rag` (or `openai` / `gemini`) |
| `MENILIK_AI_API_KEY` | Optional cloud API key | (Omitted if using local-rag) |

---

## 4. Backup, Recovery & Continuity Strategy

### 4.1 Automated Daily Backups
For managed PostgreSQL instances (or local `pg_dump` cron jobs):
```bash
# Automated daily backup dump
pg_dump -U dbu_admin -Fc -d dbu_connect > /var/backups/dbu_connect_$(date +\%F).dump
```

### 4.2 Recovery Point Objective (RPO) & Recovery Time Objective (RTO)
- **RPO (Acceptable data-loss window):** Maximum 24 hours (with daily full backups) or 1 hour (with WAL archiving).
- **RTO (Target restoration time):** Under 30 minutes.

### 4.3 Database Restoration Procedure
To restore from backup dump into a clean staging or recovery database:
```bash
pg_restore -U dbu_admin -d dbu_connect_recovery /var/backups/dbu_connect_2026-10-15.dump
```

---

## 5. Security & Maintenance Checklist
1. **Never commit `.env` files** to Git.
2. Ensure SSL/TLS encryption is enabled on port 443 with HSTS headers.
3. Keep production secrets in dedicated platform key vaults (e.g. Vercel Secrets, AWS Secrets Manager).
4. Run regular health checks against the `/api/auth/me` endpoint.
