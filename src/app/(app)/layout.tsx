import Link from "next/link";

import { signOut } from "@/lib/auth";
import { requireSession } from "@/lib/services/session";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await requireSession({ redirectTo: "/" });

  async function handleSignOut() {
    "use server";

    await signOut({
      redirectTo: "/",
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-slate-900 transition hover:text-blue-600"
          >
            COBRA
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-900">
                {session.organization?.name ?? "Organización"}
              </p>
              <p className="text-xs text-slate-500">
                {session.user.email ?? session.user.name ?? "Usuario"}
              </p>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        {children}
      </main>
    </div>
  );
}

