# Internal Audit Task Tracker — TODO Checklist

Work through these in order. Each item links to the exact file and TODO tag.

---

## Phase 1 — One-time Setup (do this first, ~1 hour)

- [x] **Install SQL Server Express** (free)
      https://www.microsoft.com/en-us/sql-server/sql-server-downloads → "Express"
- [x] **Install SQL Server Management Studio (SSMS)** (free)
      https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
- [x] **Run the database setup script**
      Open SSMS → New Query → paste `database/setup.sql` → Execute
- [x] **Copy .env.local.example to .env.local** and fill in your connection string
      Typical Windows Auth string:
      `sqlserver://localhost:1433;database=AuditTracker;integratedSecurity=true;trustServerCertificate=true;`
- [x] **Install Node dependencies**
      `npm install`
- [x] **Generate the Prisma client**
      `npm run db:generate`
      (if the DB is already running you can also try `npm run db:pull`)
- [x] **Verify the app starts**
      `npm run dev` → open http://localhost:3000
      You should be redirected to /login. The form submits but does nothing yet.

---

## Phase 2 — Core Features (MVP, ~4–5 hours)

### Auth — `lib/auth.ts`
- [x] **[Auth-1]** `lib/auth.ts` — Import `bcryptjs` (after adding password hashes to the DB)
- [x] **[Auth-2]** `lib/auth.ts` — Import the Prisma client
- [x] **[Auth-3]** `lib/auth.ts` — Replace the hardcoded DEMO_USERS array with a real DB lookup + bcrypt compare

### Login Page — `app/login/page.tsx`
- [x] **[Login-1]** `app/login/page.tsx` — Call `signIn("credentials", { email, password, redirect: false })`
                    and handle the result: set error on failure, push to /dashboard on success
      (The form inputs, loading state, and error display are already wired up)

### Audits API — `app/api/audits/route.ts`
- [x] **[API-Audits-1]** Uncomment the `prisma` import
- [x] **[API-Audits-2]** Add session guard (401 if not authenticated)
- [x] **[API-Audits-3]** Add userId validation
- [x] **[API-Audits-4]** Replace the placeholder `return NextResponse.json([])` with the real Prisma query

### Tasks API — `app/api/tasks/[id]/route.ts`
- [x] **[API-Tasks-1]** Uncomment the `prisma` import
- [x] **[API-Tasks-2]** Add session guard
- [x] **[API-Tasks-5]** Replace the placeholder response with the real `prisma.task.update(...)` call

### Dashboard Page — `app/dashboard/page.tsx`
- [x] **[Dashboard-1]** Implement the `loadAudits` fetch — fill in the try/catch body to call
                         `GET /api/audits?userId=<session.user.id>` and update state
- [x] **[Dashboard-2]** Implement `updateTaskStatus` — call `PATCH /api/tasks/<taskId>` and
                         update the local `audits` state optimistically (no page reload)

At this point the app should be fully functional. Test the happy path:
  1. Sign in as auditor@example.com / password
  2. See the two seeded audits with their tasks
  3. Click "Mark done" on a task — status badge updates in the UI

---

## Phase 3 — Nice-to-Have (if time allows)

- [ ] **[Dashboard-3]** Add "Add Task" button + inline form (POST /api/audits/[id]/tasks)
- [ ] **[API-Audits-5]** Implement POST /api/audits (Admin only)
- [ ] **[Dashboard-4]** Add a status cycle dropdown instead of just "Mark done"
- [ ] **[Dashboard-Stretch]** Convert the dashboard to a server component for better performance
- [ ] **Search bar** — client-side filter by clientName using `useMemo`
- [ ] **Admin view** — show all audits (not just assigned-to-me) when `session.user.role === "Admin"`
- [ ] **Unit test** — write one Jest test for the PATCH /api/tasks/[id] route validation logic
      (demonstrates professional discipline — mention it in the interview)

---

## Demo Script (night before the interview)

1. `npm run dev` in terminal — leave it running
2. Open http://localhost:3000 in browser
3. Walk through: login → dashboard → mark a task done → show the code in VS Code
4. Open SSMS to show the actual MSSQL table if asked

**What to say:**
> "I saw your stack required Next.js, TypeScript, and MSSQL — I hadn't used MSSQL before,
> so I built this prototype in the last two days to learn it. It's a mini audit-task tool
> that mirrors your core workflow. Want me to walk you through the code?"
