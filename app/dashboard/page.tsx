// Server component — fetches data directly from the database and passes it
// to the AuditList client component. No loading spinner needed: the page
// renders with data already present.
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditList } from "./AuditList";
import type { AuditDTO, TaskStatus } from "@/types";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "Admin";
  const userId  = parseInt(session.user.id, 10);

  const rows = await prisma.audit.findMany({
    where:   isAdmin ? {} : { assignedTo: userId },
    include: {
      tasks:          true,
      assignedToUser: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { startDate: "desc" },
  });

  // Prisma returns Date objects — serialize to ISO strings so the client
  // component (which crosses the server/client boundary) can receive them.
  const audits: AuditDTO[] = rows.map((a) => ({
    id:             a.id,
    clientName:     a.clientName,
    standard:       a.standard,
    startDate:      a.startDate.toISOString(),
    endDate:        a.endDate.toISOString(),
    assignedTo:     a.assignedTo,
    assignedToUser: a.assignedToUser ?? undefined,
    tasks:          a.tasks.map((t) => ({
      id:          t.id,
      description: t.description,
      status:      t.status as TaskStatus,
      auditId:     t.auditId,
    })),
  }));

  return (
    <AuditList
      initialAudits={audits}
      user={{
        id:   session.user.id,
        name: session.user.name ?? "User",
        role: session.user.role,
      }}
    />
  );
}
