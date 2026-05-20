// NextAuth configuration — imported by the [...nextauth] route handler
// and by server components that need to read the session.
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// TODO: [Auth-1] import bcryptjs once you add password hashing
import bcrypt from "bcryptjs";
// TODO: [Auth-2] import prisma to look up users in the database
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // TODO: [Auth-3] Replace the hardcoded demo check below with a real DB lookup:
        //   1. const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        //   2. if (!user) return null;
        //   3. const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        //   4. if (!valid) return null;
        //   5. return { id: String(user.id), name: user.name, email: user.email, role: user.role };

        const user = await prisma.user.findUnique({where: {email: credentials.email}});
        if(!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if(!valid) return null;
        return {id: String(user.id), name: user.name, email: user.email, role : user.role};

        // ── Hardcoded demo (remove this before any real deployment) ──────────
        // const DEMO_USERS = [
        //   { id: "1", name: "Auditor One", email: "auditor@example.com", password: "password", role: "Auditor" },
        //   { id: "2", name: "Admin User",  email: "admin@example.com",   password: "password", role: "Admin"   },
        // ];
        // const match = DEMO_USERS.find(
        //   (u) => u.email === credentials.email && u.password === credentials.password
        // );
        // if (!match) return null;
        // return { id: match.id, name: match.name, email: match.email, role: match.role };
        // // ─────────────────────────────────────────────────────────────────────
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
