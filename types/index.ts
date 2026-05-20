// Shared application types — derived from the Prisma models but safe to import
// in both client and server components.

export type TaskStatus = "pending" | "in-progress" | "done";
export type UserRole   = "Auditor" | "Admin";

export interface TaskDTO {
  id:          number;
  description: string;
  status:      TaskStatus;
  auditId:     number;
}

export interface AuditDTO {
  id:             number;
  clientName:     string;
  standard:       string;
  startDate:      string; // ISO date string
  endDate:        string;
  assignedTo:     number;
  tasks:          TaskDTO[];
}

export interface UserDTO {
  id:    number;
  name:  string;
  email: string;
  role:  UserRole;
}
