import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// TODO: [API-Tasks-1] uncomment once the database is set up
// import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@/types";

const VALID_STATUSES: TaskStatus[] = ["pending", "in-progress", "done"];

// PATCH /api/tasks/<id>
// Body: { status: "pending" | "in-progress" | "done" }
// Updates a single task's status.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO: [API-Tasks-2] Protect this route
  //   const session = await getServerSession(authOptions);
  //   if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: [API-Tasks-3] Validate the id param
  const taskId = parseInt(params.id, 10);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  // TODO: [API-Tasks-4] Parse and validate the request body
  const body = await request.json() as { status?: unknown };
  if (!body.status || !VALID_STATUSES.includes(body.status as TaskStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }
  const newStatus = body.status as TaskStatus;

  // TODO: [API-Tasks-5] Update the record in the database:
  //   const task = await prisma.task.update({
  //     where: { id: taskId },
  //     data:  { status: newStatus },
  //   });
  //   return NextResponse.json(task);

  // Placeholder response — remove once the real update is in place
  return NextResponse.json({ id: taskId, status: newStatus });
}
