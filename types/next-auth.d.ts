import { MembershipRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: MembershipRole;
    };
    organization?: {
      id: string;
      name: string;
      slug: string | null;
      countryCode?: string | null;
      defaultCurrency?: string | null;
    };
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role?: MembershipRole;
  }
}

