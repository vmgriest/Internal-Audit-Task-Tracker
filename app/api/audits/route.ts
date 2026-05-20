import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// TODO: [API-Audits-1] uncomment once the database is set up
// import { prisma } from "@/lib/prisma";

// GET /api/audits?userId=<id>
// Returns all audits (with their tasks) assigned to the given user.
export async function GET(request: Request) {
  // TODO: [API-Audits-2] Protect this route — verify the session exists
  //   const session = await getServerSession(authOptions);
  //   if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get("userId");

  // TODO: [API-Audits-3] Validate userId — it should be a positive integer
  //   if (!userIdParam || isNaN(Number(userIdParam))) {
  //     return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  //   }
  const userId = userIdParam ? parseInt(userIdParam, 10) : null;

  // TODO: [API-Audits-4] Query the database:
  //   const audits = await prisma.audit.findMany({
  //     where:   userId ? { assignedTo: userId } : {},
  //     include: { tasks: true, assignedToUser: true },
  //     orderBy: { startDate: "desc" },
  //   });
  //   return NextResponse.json(audits);

  // Placeholder response — remove once the real query is in place
  return NextResponse.json([]);
}

// POST /api/audits
// Creates a new audit record.
// TODO: [API-Audits-5] Implement this (nice-to-have — focus on GET first)
export async function POST(request: Request) {
  // TODO: [API-Audits-5]
  //   const session = await getServerSession(authOptions);
  //   if (!session || session.user.role !== "Admin") {
  //     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  //   }
  //   const body = await request.json();
  //   validate body fields…
  //   const audit = await prisma.audit.create({ data: { ...body } });
  //   return NextResponse.json(audit, { status: 201 });
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
