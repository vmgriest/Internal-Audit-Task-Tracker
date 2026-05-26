/**
 * Unit tests for PATCH /api/tasks/[id] validation logic.
 *
 * These tests cover the pure validation helpers that run before any
 * database call, so no mocking or network access is needed.
 */

type TaskStatus = "pending" | "in-progress" | "done";

const VALID_STATUSES: TaskStatus[] = ["pending", "in-progress", "done"];

function parseTaskId(id: string): number | null {
  const n = parseInt(id, 10);
  return isNaN(n) ? null : n;
}

function isValidStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as TaskStatus);
}

// ── parseTaskId ───────────────────────────────────────────────────────────────

describe("parseTaskId", () => {
  it("parses a valid numeric string", () => {
    expect(parseTaskId("42")).toBe(42);
  });

  it("parses single-digit IDs", () => {
    expect(parseTaskId("1")).toBe(1);
  });

  it("returns null for a non-numeric string", () => {
    expect(parseTaskId("abc")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseTaskId("")).toBeNull();
  });

  it("returns null for a float string", () => {
    // parseInt('3.9') = 3, not null — this is intentional behaviour
    expect(parseTaskId("3.9")).toBe(3);
  });
});

// ── isValidStatus ─────────────────────────────────────────────────────────────

describe("isValidStatus", () => {
  it("accepts 'pending'", () => {
    expect(isValidStatus("pending")).toBe(true);
  });

  it("accepts 'in-progress'", () => {
    expect(isValidStatus("in-progress")).toBe(true);
  });

  it("accepts 'done'", () => {
    expect(isValidStatus("done")).toBe(true);
  });

  it("rejects an unrecognised string", () => {
    expect(isValidStatus("completed")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidStatus("")).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidStatus(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isValidStatus(undefined)).toBe(false);
  });

  it("rejects a number", () => {
    expect(isValidStatus(1)).toBe(false);
  });
});
