# DevOops DNS Manager

Enterprise-style DNS management portal for `devoops.in`, backed by the GoDaddy REST API.

**Status: Phase 1 (Backend)** — this delivery contains the NestJS API, Prisma schema,
Postgres, Docker Compose, auth/RBAC, and full GoDaddy DNS CRUD + sync.
The Next.js frontend dashboard is Phase 2 (next delivery).

---

## 1. Get your GoDaddy API credentials

1. Go to https://developer.godaddy.com/keys and log in with the account that owns `devoops.in`.
2. Click **Create New API Key** → name it (e.g. `devoops-dns-manager`) → environment: **Production**.
3. Copy the **Key** and **Secret** immediately (the secret is shown only once).
4. Verify it works:
   ```bash
   curl -H "Authorization: sso-key YOUR_KEY:YOUR_SECRET" \
     "https://api.godaddy.com/v1/domains/devoops.in/records"
   ```
   A JSON array of records (not a 401/403) means it's working.

## 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in:
- `GO_DADDY_API_KEY` / `GO_DADDY_API_SECRET` — from step 1
- `JWT_ACCESS_SECRET` — any long random string, e.g. `openssl rand -hex 32`
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — your first Super Admin login (change the password after first login)

## 3. Run with Docker

From the repo root:

```bash
docker compose up --build
```

This starts:
- **postgres** on `localhost:5432`
- **backend** (NestJS API) on `localhost:4000`, which automatically:
  - pushes the Prisma schema to Postgres
  - seeds your first Super Admin user
  - starts listening

Health check: `GET http://localhost:4000/health`

## 4. Log in

```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"devoops.in@gmail.com","password":"Admin@321"}'
```

Response includes an `accessToken` (use as `Authorization: Bearer <token>` on subsequent
requests) and sets an httpOnly `refresh_token` cookie.

**Immediately change the seeded password:**
```bash
curl -X POST http://localhost:4000/api/change-password \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Admin@321","newPassword":"YourNewStrongPassword!"}'
```

## 5. Create your first subdomain

```bash
curl -X POST http://localhost:4000/api/dns \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "grafana",
    "type": "A",
    "data": "203.0.113.10",
    "ttl": 3600,
    "comment": "Grafana monitoring"
  }'
```

This creates `grafana.devoops.in` on GoDaddy and records it locally.

---

## API Reference

| Method | Endpoint                | Roles                              | Description                     |
|--------|--------------------------|-------------------------------------|----------------------------------|
| POST   | `/api/login`             | Public                              | Log in, returns access token     |
| POST   | `/api/refresh`           | Public (cookie)                     | Rotate access token               |
| POST   | `/api/logout`            | Authenticated                       | Revoke refresh token              |
| POST   | `/api/change-password`   | Authenticated                       | Change own password               |
| POST   | `/api/forgot-password`   | Public                              | Request password reset token      |
| POST   | `/api/reset-password`    | Public                              | Reset password with token         |
| GET    | `/api/profile`           | Authenticated                       | Current user profile              |
| GET    | `/api/users`             | Admin, Super Admin                  | List users                        |
| POST   | `/api/users`             | Super Admin                         | Create user                       |
| PUT    | `/api/users/:id`         | Super Admin                         | Update user (role, active status) |
| DELETE | `/api/users/:id`         | Super Admin                         | Delete user                       |
| GET    | `/api/dns`               | All roles                           | List/search/filter DNS records    |
| GET    | `/api/dns/:id`           | All roles                           | Get one record                    |
| POST   | `/api/dns`               | Developer, Admin, Super Admin       | Create record (writes to GoDaddy) |
| PUT    | `/api/dns/:id`           | Developer, Admin, Super Admin       | Update record                     |
| DELETE | `/api/dns/:id`           | Admin, Super Admin                  | Delete record                     |
| POST   | `/api/dns/bulk-delete`   | Admin, Super Admin                  | Delete multiple records           |
| POST   | `/api/dns/sync`          | Admin, Super Admin                  | Pull live records from GoDaddy    |
| GET    | `/api/dashboard`         | Authenticated                       | Dashboard stats                   |
| GET    | `/api/activity`          | Authenticated                       | Paginated activity log            |
| GET    | `/health`                | Public                              | Health check                      |

## Role permissions

| Role         | Read DNS | Create/Update DNS | Delete DNS | Manage Users |
|--------------|----------|--------------------|-----------|--------------|
| Super Admin  | ✅       | ✅                  | ✅         | ✅            |
| Admin        | ✅       | ✅                  | ✅         | View only     |
| Developer    | ✅       | ✅                  | ❌         | ❌            |
| Viewer       | ✅       | ❌                  | ❌         | ❌            |

## Local (non-Docker) development

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run start:dev
```
(Requires a local or remote Postgres reachable at `DATABASE_URL` in `.env`.)

## Security notes

- GoDaddy secrets never leave the backend — the frontend will only ever call our own API.
- Passwords hashed with bcrypt (cost factor 12).
- Access tokens are short-lived (15m); refresh tokens are rotated on every use and stored
  hashed-at-rest is recommended for production hardening (currently stored as opaque
  random tokens — consider hashing them in the DB before going to production).
- Helmet, CORS allow-list, global rate limiting (100 req/min/IP), class-validator input
  validation, and Prisma parameterized queries (SQL-injection safe) are all enabled by default.
- Every DNS mutation is written to `activity_logs` (human-readable) and `audit_logs`
  (structured, with request IP + user agent) tables.

## What's next (Phase 2+)

- Next.js 15 + shadcn/ui frontend dashboard (login, DNS table, charts, dark/light mode)
- CSV import/export, keyboard shortcuts, notification center
- GitHub Actions CI/CD pipeline
- Unit tests for `DnsService`, `AuthService`, `GoDaddyService`
- Nginx reverse proxy + HTTPS config for production deployment
