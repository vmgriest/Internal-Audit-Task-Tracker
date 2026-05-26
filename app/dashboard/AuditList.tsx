"use client";

import { useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import type { AuditDTO, TaskStatus } from "@/types";

// ── Sub-components ────────────────────────────────────────────────────────────

function TaskStatusDropdown({
  taskId,
  currentStatus,
  onUpdate,
}: {
  taskId:        number;
  currentStatus: TaskStatus;
  onUpdate:      (id: number, status: TaskStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
      >
        Change ▼
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white border rounded-md shadow-lg z-10">
          {(["pending", "in-progress", "done"] as TaskStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => { onUpdate(taskId, s); setIsOpen(false); }}
              className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                currentStatus === s ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
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

function AddTaskButton({ onAddTask }: { onAddTask: (desc: string) => Promise<void> }) {
  const [isAdding,     setIsAdding]     = useState(false);
  const [description,  setDescription]  = useState("");
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
        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
      >
        + Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description..."
        autoFocus
        className="text-sm border rounded px-2 py-1 w-52 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isSubmitting || !description.trim()}
        className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-1 rounded"
      >
        {isSubmitting ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => { setIsAdding(false); setDescription(""); }}
        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
      >
        Cancel
      </button>
    </form>
  );
}

const ISO_STANDARDS = ["ISO 9001", "ISO 45001", "ISO 14001", "ISO 27001", "ISO 22000", "Other"];

function AddCompanyForm({
  userId,
  onAdd,
  onCancel,
}: {
  userId:   string;
  onAdd:    (audit: AuditDTO) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [clientName,   setClientName]   = useState("");
  const [standard,     setStandard]     = useState(ISO_STANDARDS[0]);
  const [customStd,    setCustomStd]    = useState("");
  const [startDate,    setStartDate]    = useState(today);
  const [endDate,      setEndDate]      = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const effectiveStandard = standard === "Other" ? customStd : standard;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveStandard.trim()) { setError("Please enter a standard."); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/audits", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          clientName,
          standard: effectiveStandard,
          startDate,
          endDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create audit");
      }
      const raw = await res.json();
      // Serialize dates so the DTO matches what the server component would return
      const audit: AuditDTO = {
        id:             raw.id,
        clientName:     raw.clientName,
        standard:       raw.standard,
        startDate:      raw.startDate,
        endDate:        raw.endDate,
        assignedTo:     raw.assignedTo,
        assignedToUser: raw.assignedToUser,
        tasks:          raw.tasks ?? [],
      };
      onAdd(audit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create audit");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-sm mb-4">Add New Company / Audit</h3>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Client / Company Name</label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Standard</label>
          <select
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ISO_STANDARDS.map((s) => <option key={s}>{s}</option>)}
          </select>
          {standard === "Other" && (
            <input
              type="text"
              required
              value={customStd}
              onChange={(e) => setCustomStd(e.target.value)}
              placeholder="Enter standard name"
              className="w-full border rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {isSubmitting ? "Creating…" : "Create Audit"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialAudits: AuditDTO[];
  user: { id: string; name: string; role: string };
}

export function AuditList({ initialAudits, user }: Props) {
  const [audits,          setAudits]          = useState<AuditDTO[]>(initialAudits);
  const [search,          setSearch]          = useState("");
  const [updatingTaskId,  setUpdatingTaskId]  = useState<number | null>(null);
  const [deletingTaskId,  setDeletingTaskId]  = useState<number | null>(null);
  const [error,           setError]           = useState<string | null>(null);
  const [showAddCompany,  setShowAddCompany]  = useState(false);

  const filtered = useMemo(
    () => audits.filter((a) =>
      a.clientName.toLowerCase().includes(search.toLowerCase()) ||
      a.standard.toLowerCase().includes(search.toLowerCase())
    ),
    [audits, search]
  );

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  }

  async function updateTaskStatus(taskId: number, newStatus: TaskStatus) {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const updated = await res.json();
      setAudits((prev) =>
        prev.map((a) => ({
          ...a,
          tasks: a.tasks.map((t) => (t.id === taskId ? { ...t, status: updated.status } : t)),
        }))
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function deleteTask(taskId: number) {
    setDeletingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setAudits((prev) =>
        prev.map((a) => ({ ...a, tasks: a.tasks.filter((t) => t.id !== taskId) }))
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeletingTaskId(null);
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
        prev.map((a) => (a.id === auditId ? { ...a, tasks: [...a.tasks, newTask] } : a))
      );
    } catch {
      showError("Failed to add task");
    }
  }

  function addAudit(audit: AuditDTO) {
    setAudits((prev) => [audit, ...prev]);
    setShowAddCompany(false);
  }

  const isAdmin = user.role === "Admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Audit Task Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.name} &middot;{" "}
            <span className={`font-medium ${isAdmin ? "text-purple-600" : "text-blue-600"}`}>
              {user.role}
            </span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-red-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto p-6 space-y-4">

        {/* Toolbar: search + add company */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name or standard…"
              className="w-full border rounded-lg px-4 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAddCompany((v) => !v)}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {showAddCompany ? "✕ Cancel" : "+ Add Company"}
          </button>
        </div>

        {/* Add company form */}
        {showAddCompany && (
          <AddCompanyForm
            userId={user.id}
            onAdd={addAudit}
            onCancel={() => setShowAddCompany(false)}
          />
        )}

        {/* Admin banner */}
        {isAdmin && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 text-sm text-purple-700">
            Admin view — showing all audits across all auditors
          </div>
        )}

        {/* Error toast */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        {/* Empty states */}
        {filtered.length === 0 && !error && (
          <p className="text-gray-500 text-sm">
            {search ? `No audits match "${search}".` : "No audits yet — add a company to get started."}
          </p>
        )}

        {/* Audit cards */}
        {filtered.map((audit) => (
          <div key={audit.id} className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h2 className="text-lg font-semibold">{audit.clientName}</h2>
                <p className="text-sm text-gray-500">
                  {audit.standard} &bull; {audit.startDate.slice(0, 10)} → {audit.endDate.slice(0, 10)}
                </p>
                {isAdmin && audit.assignedToUser && (
                  <p className="text-xs text-purple-600 mt-0.5">
                    Assigned to: {audit.assignedToUser.name}
                  </p>
                )}
              </div>
              <AddTaskButton onAddTask={(desc) => addTask(audit.id, desc)} />
            </div>

            {/* Task list */}
            {audit.tasks.length === 0 ? (
              <p className="text-sm text-gray-400 italic mt-3">No tasks yet.</p>
            ) : (
              <ul className="divide-y mt-2">
                {audit.tasks.map((task) => (
                  <li key={task.id} className="flex justify-between items-center py-2 gap-2">
                    <span className="text-sm flex-1">{task.description}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.status === "done"
                          ? "bg-green-100 text-green-700"
                          : task.status === "in-progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {task.status}
                      </span>

                      {task.status !== "done" && (
                        <button
                          onClick={() => updateTaskStatus(task.id, "done")}
                          disabled={updatingTaskId === task.id}
                          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-0.5 rounded transition-colors"
                        >
                          {updatingTaskId === task.id ? "…" : "Done"}
                        </button>
                      )}

                      <TaskStatusDropdown
                        taskId={task.id}
                        currentStatus={task.status as TaskStatus}
                        onUpdate={updateTaskStatus}
                      />

                      {/* Remove task */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        disabled={deletingTaskId === task.id}
                        title="Remove task"
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 px-1 py-0.5 rounded transition-colors"
                      >
                        {deletingTaskId === task.id ? "…" : "✕"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Progress summary */}
            <p className="text-xs text-gray-400 mt-3">
              {audit.tasks.filter((t) => t.status === "done").length} / {audit.tasks.length} tasks complete
            </p>
          </div>
        ))}
      </main>
    </div>
  );
}
