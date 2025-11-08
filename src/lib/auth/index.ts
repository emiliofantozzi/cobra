import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/db";
import { env } from "@/lib/config/env";
import { ensurePrimaryMembership } from "@/lib/services/organizations";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: env.AUTH_SECRET,
  session: {
    strategy: "database",
  },
  trustHost: true,
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user?.id) {
        return;
      }

      await ensurePrimaryMembership({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
      });
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (!session.user || !user?.id) {
        return session;
      }

      session.user.id = user.id;

      const membership = await prisma.membership.findFirst({
        where: { userId: user.id },
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (membership) {
        session.user.role = membership.role;
        session.organization = {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
        };
      }

      return session;
    },
  },
});

