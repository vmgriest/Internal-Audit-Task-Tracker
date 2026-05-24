import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/tasks
// Body: { auditId: number, description: string, status?: TaskStatus }
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { auditId, description, status = "pending" } = body;

    if (!auditId || typeof auditId !== "number") {
      return NextResponse.json({ error: "Valid auditId is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }

    // Verify the audit exists and the user has access to it
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
    if (session.user.role !== "Admin" && audit.assignedTo !== parseInt(session.user.id, 10)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const task = await prisma.task.create({
      data: {
        description: description.trim(),
        status,
        auditId,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
