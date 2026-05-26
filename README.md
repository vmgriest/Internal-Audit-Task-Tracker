# Internal Audit Task Tracker

A full-stack web app for managing ISO audit tasks, built with Next.js, TypeScript, Prisma, and SQL Server.

Built as a learning project to explore the stack used at PJR (Next.js + TypeScript + MSSQL).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | SQL Server Express (MSSQL) |
| ORM | Prisma 6 |
| Auth | NextAuth.js v4 (credentials + JWT) |
| Styling | Tailwind CSS |
| Testing | Jest + ts-jest |

---

## Features

- **Role-based access** — Auditor and Admin roles with different permissions
- **Audit management** — Create audits assigned to auditors with client name, ISO standard, and date range
- **Task tracking** — Add, update, and remove tasks within each audit
- **Status workflow** — Tasks cycle through `pending` → `in-progress` → `done`
- **Live search** — Filter audits by client name or standard instantly
- **Admin view** — Admins see all audits across all auditors
- **One-click demo login** — Pre-seeded accounts for fast demo access

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (free)
- [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) (free)

---

## Setup

### 1. Create the database

Open SSMS, connect to your SQL Server instance, open a new query window, paste the contents of `database/setup.sql`, and execute it. This creates the `AuditTracker` database and seeds two users and sample audit data.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your SQL Server connection string:

```env
# Windows Authentication (no username/password needed)
DATABASE_URL="sqlserver://localhost:1433;database=AuditTracker;integratedSecurity=true;trustServerCertificate=true;"

# For SQL Server Express with a named instance and dynamic port, use the port directly:
# DATABASE_URL="sqlserver://HOSTNAME:PORT;database=AuditTracker;integratedSecurity=true;trustServerCertificate=true;"

NEXTAUTH_SECRET="replace-me-with-a-real-secret"
NEXTAUTH_URL="http://localhost:3000"
```

To find your SQL Server Express dynamic port: open SSMS → connect → run `SELECT @@SERVERNAME` to confirm the instance, then check SQL Server Configuration Manager for the TCP port under Protocols → TCP/IP → IP Addresses → IPAll.

### 3. Install dependencies and generate the Prisma client

```bash
npm install
npm run db:generate
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

---

## Demo Accounts

The setup script seeds two accounts. The password for both is `password`.

| Name | Email | Role |
|---|---|---|
| Vincent | auditor@example.com | Auditor |
| Admin User | admin@example.com | Admin |

On the login page, click either account button to sign in instantly — no typing required.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── audits/route.ts          # GET, POST, DELETE /api/audits
│   │   └── tasks/
│   │       ├── route.ts             # POST /api/tasks
│   │       └── [id]/route.ts        # GET, PATCH, DELETE /api/tasks/:id
│   ├── dashboard/
│   │   ├── page.tsx                 # Server component — fetches audits via Prisma
│   │   └── AuditList.tsx            # Client component — all interactive UI
│   ├── login/page.tsx               # Login page with one-click demo accounts
│   └── layout.tsx
├── database/
│   └── setup.sql                    # DB creation + seed script
├── lib/
│   ├── auth.ts                      # NextAuth configuration
│   └── prisma.ts                    # Prisma singleton
├── prisma/
│   └── schema.prisma                # Data models (User, Audit, Task)
├── types/
│   ├── index.ts                     # Shared DTOs (AuditDTO, TaskDTO, etc.)
│   └── next-auth.d.ts               # NextAuth type augmentations
└── __tests__/
    └── tasks-patch.test.ts          # Unit tests for task route helpers
```

---

## API Reference

### Audits

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/audits?userId=<id>` | Any | Get audits for a user (Admin can omit userId for all) |
| POST | `/api/audits` | Any | Create a new audit (auditors self-assign) |
| DELETE | `/api/audits?id=<id>` | Admin | Delete an audit and all its tasks |

### Tasks

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks/:id` | Any | Get a single task |
| POST | `/api/tasks` | Any | Create a task on an audit |
| PATCH | `/api/tasks/:id` | Any | Update task status |
| DELETE | `/api/tasks/:id` | Any | Delete a task (must be assigned auditor or Admin) |

---

## Running Tests

```bash
npm test
```

13 unit tests covering the task route's input validation helpers (`parseTaskId`, `isValidStatus`).

---

## Database Schema

```sql
Users  (Id, Name, Email, Role)
Audits (Id, ClientName, Standard, StartDate, EndDate, AssignedTo → Users.Id)
Tasks  (Id, Description, Status, AuditId → Audits.Id ON DELETE CASCADE)
```

ISO standards supported in the UI: ISO 9001, ISO 45001, ISO 14001, ISO 27001, ISO 22000, and custom input.
