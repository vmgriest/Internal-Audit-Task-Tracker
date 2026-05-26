import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@/types";

const VALID_STATUSES: TaskStatus[] = ["pending", "in-progress", "done"];

type RouteParams = { params: Promise<{ id: string }> };

function parseTaskId(id: string) {
  const n = parseInt(id, 10);
  return isNaN(n) ? null : n;
}

// GET /api/tasks/<id>
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseTaskId(id);
    if (!taskId) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        audit: {
          include: {
            assignedToUser: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAdmin          = session.user.role === "Admin";
    const isAssignedAuditor = task.audit.assignedTo === parseInt(session.user.id, 10);
    if (!isAdmin && !isAssignedAuditor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/tasks/<id>
// Body: { status: "pending" | "in-progress" | "done" }
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseTaskId(id);
    if (!taskId) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const body = await request.json() as { status?: unknown };
    if (!body.status || !VALID_STATUSES.includes(body.status as TaskStatus)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    const newStatus = body.status as TaskStatus;

    const existingTask = await prisma.task.findUnique({
      where:   { id: taskId },
      include: { audit: true },
    });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAdmin           = session.user.role === "Admin";
    const isAssignedAuditor = existingTask.audit.assignedTo === parseInt(session.user.id, 10);
    if (!isAdmin && !isAssignedAuditor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data:  { status: newStatus },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/<id>  (Admin or assigned auditor)
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseTaskId(id);
    if (!taskId) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const existingTask = await prisma.task.findUnique({
      where:   { id: taskId },
      include: { audit: true },
    });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAdmin           = session.user.role === "Admin";
    const isAssignedAuditor = existingTask.audit.assignedTo === parseInt(session.user.id, 10);
    if (!isAdmin && !isAssignedAuditor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
