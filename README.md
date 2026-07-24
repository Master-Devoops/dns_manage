# DNS Manage

Professional subdomain / DNS record manager for GoDaddy, with **MySQL**, **admin + client roles**, and full audit of who created each record.

## Features

- MySQL storage for users and DNS record ownership
- Admin login + create client users
- Clients only see records they added
- Admin sees all records with **Created by** name
- Create / edit / delete DNS records (synced to GoDaddy + saved in DB)
- Search and filter by record type

## Roles

| Role | Can do |
|------|--------|
| **Admin** | Manage users, see all DNS records, see who created each record |
| **Client** | Add/edit/delete only their own records |

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express, TypeScript, MySQL |
| Frontend | React, Vite, TypeScript |
| Provider | GoDaddy Domains API |

## Setup

### 1. MySQL

Make sure MySQL is running, then create the database (optional — the app can create it):

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS dns_manage;"
```

### 2. GoDaddy API keys

Create keys at [developer.godaddy.com/keys](https://developer.godaddy.com/keys).

### 3. Backend

```bash
cd backend
cp .env.example .env
```

Configure `.env`:

```env
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=Admin@321
JWT_SECRET=long-random-secret

GODADDY_API_KEY=...
GODADDY_API_SECRET=...

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=dns_manage
```

```bash
npm install
npm run dev
```

On startup the API:
- Creates tables (`users`, `dns_records`)
- Seeds the admin user from `ADMIN_USERNAME` / `ADMIN_PASSWORD`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

1. Sign in as admin
2. Go to **Users** → create a client
3. Client login → add DNS records (only their records are shown)
4. Admin opens the same domain → sees all records + creator name

## API overview

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/login` | Login |
| GET | `/api/users` | Admin: list users |
| POST | `/api/users` | Admin: create user |
| GET | `/api/domains/:domain/records` | Client = own only; Admin = all + creator |
| POST/PUT/DELETE | `/api/domains/:domain/records` | Synced to GoDaddy + MySQL |

## Notes

- After changing `.env`, restart the backend
- Old browser tokens may be invalid after this update — sign out and log in again
- GoDaddy credentials stay on the server only

## License

Private — for your own use.
