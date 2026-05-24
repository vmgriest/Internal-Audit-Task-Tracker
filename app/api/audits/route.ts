import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/audits?userId=<id>
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam || isNaN(Number(userIdParam))) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }
    const userId = parseInt(userIdParam, 10);

    // Non-admin users can only view their own audits
    if (session.user.role !== "Admin" && parseInt(session.user.id, 10) !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const audits = await prisma.audit.findMany({
      where:   { assignedTo: userId },
      include: {
        tasks:          true,
        assignedToUser: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/audits  (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { clientName, standard, startDate, endDate, assignedTo } = body;

    if (!clientName || typeof clientName !== "string" || clientName.trim().length === 0) {
      return NextResponse.json({ error: "clientName is required" }, { status: 400 });
    }
    if (clientName.length > 200) {
      return NextResponse.json({ error: "clientName must be 200 characters or less" }, { status: 400 });
    }
    if (!standard || typeof standard !== "string" || standard.trim().length === 0) {
      return NextResponse.json({ error: "standard is required" }, { status: 400 });
    }
    if (standard.length > 100) {
      return NextResponse.json({ error: "standard must be 100 characters or less" }, { status: 400 });
    }
    if (!assignedTo || typeof assignedTo !== "number") {
      return NextResponse.json({ error: "Valid assignedTo userId is required" }, { status: 400 });
    }
    if (!startDate || isNaN(Date.parse(startDate))) {
      return NextResponse.json({ error: "Valid startDate is required" }, { status: 400 });
    }
    if (!endDate || isNaN(Date.parse(endDate))) {
      return NextResponse.json({ error: "Valid endDate is required" }, { status: 400 });
    }

    const startDateObj = new Date(startDate);
    const endDateObj   = new Date(endDate);

    if (endDateObj <= startDateObj) {
      return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
    }

    const assignedUser = await prisma.user.findUnique({ where: { id: assignedTo } });
    if (!assignedUser) {
      return NextResponse.json({ error: "Assigned user does not exist" }, { status: 400 });
    }
    if (assignedUser.role !== "Auditor") {
      return NextResponse.json({ error: "Audits can only be assigned to users with the 'Auditor' role" }, { status: 400 });
    }

    const audit = await prisma.audit.create({
      data: {
        clientName: clientName.trim(),
        standard:   standard.trim(),
        startDate:  startDateObj,
        endDate:    endDateObj,
        assignedTo: assignedTo,
      },
      include: {
        assignedToUser: { select: { id: true, name: true, email: true, role: true } },
        tasks:          true,
      },
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error("Error creating audit:", error);
    if (error instanceof Error && error.message.includes("Foreign Key")) {
      return NextResponse.json({ error: "Invalid user reference" }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Duplicate entry detected" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/audits?id=<auditId>  (Admin only)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const auditIdParam = searchParams.get("id");

    if (!auditIdParam || isNaN(Number(auditIdParam))) {
      return NextResponse.json({ error: "Valid audit id is required" }, { status: 400 });
    }
    const auditId = parseInt(auditIdParam, 10);

    const existingAudit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!existingAudit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Tasks are deleted automatically via onDelete: Cascade
    await prisma.audit.delete({ where: { id: auditId } });

    return NextResponse.json({ message: "Audit deleted successfully" });
  } catch (error) {
    console.error("Error deleting audit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
