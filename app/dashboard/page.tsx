"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { AuditDTO, TaskStatus } from "@/types";

// ── Sub-components (defined outside DashboardPage so React doesn't recreate
//    their component type on every render, which would reset their local state) ──

function TaskStatusDropdown({
  taskId,
  currentStatus,
  onUpdate,
}: {
  taskId: number;
  currentStatus: TaskStatus;
  onUpdate: (taskId: number, status: TaskStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
      >
        Change Status ▼
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white border rounded-md shadow-lg z-10">
          {(["pending", "in-progress", "done"] as TaskStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => { onUpdate(taskId, s); setIsOpen(false); }}
              className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                currentStatus === s ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddTaskButton({ onAddTask }: { onAddTask: (description: string) => Promise<void> }) {
  const [isAdding, setIsAdding]       = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setIsSubmitting(true);
    await onAddTask(description.trim());
    setIsSubmitting(false);
    setDescription("");
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
      >
        + Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description..."
        className="text-sm border rounded px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
        autoFocus
      />
      <button
        type="submit"
        disabled={isSubmitting || !description.trim()}
        className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-1 rounded"
      >
        {isSubmitting ? "Adding..." : "Add"}
      </button>
      <button
        type="button"
        onClick={() => setIsAdding(false)}
        className="text-xs bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded"
      >
        Cancel
      </button>
    </form>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [audits,        setAudits]        = useState<AuditDTO[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

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

  async function updateTaskStatus(taskId: number, newStatus: TaskStatus) {
    try {
      setUpdatingTaskId(taskId);

      const res = await fetch(`/api/tasks/${taskId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task");
      }

      const updatedTask = await res.json();

      setAudits((prev) =>
        prev.map((audit) => ({
          ...audit,
          tasks: audit.tasks.map((t) => (t.id === taskId ? { ...t, status: updatedTask.status } : t)),
        }))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update task";
      setError(msg);
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function addTask(auditId: number, description: string) {
    try {
      const res = await fetch("/api/tasks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ auditId, description, status: "pending" }),
      });

      if (!res.ok) throw new Error("Failed to add task");

      const newTask = await res.json();

      setAudits((prev) =>
        prev.map((audit) =>
          audit.id === auditId ? { ...audit, tasks: [...audit.tasks, newTask] } : audit
        )
      );
    } catch (err) {
      setError("Failed to add task");
      setTimeout(() => setError(null), 3000);
    }
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

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
        )}

        {audits.length === 0 && !error && (
          <p className="text-gray-500">No audits assigned to you.</p>
        )}

        {audits.map((audit) => (
          <div key={audit.id} className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-lg font-semibold">{audit.clientName}</h2>
                <p className="text-sm text-gray-500">
                  {audit.standard} &bull; {audit.startDate.slice(0, 10)} → {audit.endDate.slice(0, 10)}
                </p>
              </div>
              <AddTaskButton onAddTask={(desc) => addTask(audit.id, desc)} />
            </div>

            <ul className="divide-y">
              {audit.tasks.map((task) => (
                <li key={task.id} className="flex justify-between items-center py-2">
                  <span className="text-sm">{task.description}</span>
                  <div className="flex items-center gap-2">
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

                    {task.status !== "done" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "done")}
                        disabled={updatingTaskId === task.id}
                        className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-1 rounded transition-colors"
                      >
                        {updatingTaskId === task.id ? "Updating…" : "Mark done"}
                      </button>
                    )}

                    <TaskStatusDropdown
                      taskId={task.id}
                      currentStatus={task.status as TaskStatus}
                      onUpdate={updateTaskStatus}
                    />
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
