import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function getCurrentSession() {
  const session = await auth();
  return session;
}

export async function requireSession(options?: { redirectTo?: string }) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect(options?.redirectTo ?? "/");
  }

  return session;
}

