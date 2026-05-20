"use client";

// SessionProvider must be a client component — this thin wrapper lets the
// root layout (a server component) pass the session down to the tree.
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
