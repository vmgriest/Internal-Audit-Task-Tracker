"use client";

// TODO: [Dashboard-Stretch] Convert this to a server component for better performance:
//   1. Remove "use client" and the useEffect/useState
//   2. const session = await getServerSession(authOptions)
//   3. const audits  = await prisma.audit.findMany({ where: { assignedTo: session.user.id }, include: { tasks: true } })
//   4. Pass audits as a prop to a child "AuditList" client component that handles button clicks

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { AuditDTO, TaskStatus } from "@/types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [audits,  setAudits]  = useState<AuditDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // TODO: [Dashboard-1] Fetch audits for the logged-in user:
  //   GET /api/audits?userId=<session.user.id>
  //   On success  → setAudits(data)
  //   On failure  → setError("Failed to load audits")
  //   Finally     → setLoading(false)
  useEffect(() => {
    if (status !== "authenticated") return;

    // TODO: [Dashboard-1] replace this placeholder fetch
    async function loadAudits() {
      try {
        const res = await fetch(`/api/audits?userId=${session!.user.id}`);
        if (!res.ok) throw new Error("Request failed");
        const data: AuditDTO[] = await res.json();
        setAudits(data);
      } catch {
        setError("Failed to load audits.");
      } finally {
        setLoading(false);
      }
    }

    loadAudits();
  }, [status, session]);

  // TODO: [Dashboard-2] Implement task status update:
  //   PATCH /api/tasks/<taskId>  { status: newStatus }
  //   On success, update the local `audits` state without a full page reload
  async function updateTaskStatus(taskId: number, newStatus: TaskStatus) {
    // TODO: [Dashboard-2] implement this — don't use window.location.reload()
    console.log("TODO: PATCH /api/tasks/" + taskId, { status: newStatus });
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Nav ───────────────────────────────────────────────────── */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Audit Task Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {session?.user.name} &middot;{" "}
            <span className="font-medium">{session?.user.role}</span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-red-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {audits.length === 0 && !error && (
          <p className="text-gray-500">No audits assigned to you.</p>
        )}

        {audits.map((audit) => (
          <div key={audit.id} className="bg-white rounded-xl border shadow-sm p-5">
            {/* ── Audit header ────────────────────────────────────── */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-lg font-semibold">{audit.clientName}</h2>
                <p className="text-sm text-gray-500">
                  {audit.standard} &bull; {audit.startDate.slice(0, 10)} → {audit.endDate.slice(0, 10)}
                </p>
              </div>
              {/* TODO: [Dashboard-3] Add an "Add Task" button that opens a form */}
            </div>

            {/* ── Task list ───────────────────────────────────────── */}
            <ul className="divide-y">
              {audit.tasks.map((task) => (
                <li key={task.id} className="flex justify-between items-center py-2">
                  <span className="text-sm">{task.description}</span>
                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.status === "done"
                          ? "bg-green-100 text-green-700"
                          : task.status === "in-progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {task.status}
                    </span>

                    {/* Complete button — hidden once done */}
                    {task.status !== "done" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "done")}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                      >
                        Mark done
                      </button>
                    )}

                    {/* TODO: [Dashboard-4] Add a dropdown/select to cycle through all statuses */}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </main>
    </div>
  );
}
