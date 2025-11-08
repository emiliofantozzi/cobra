import { signIn } from "@/lib/auth";

export default function MarketingPage() {
  async function handleSignIn() {
    "use server";

    await signIn("google", {
      redirectTo: "/dashboard",
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-24 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-700/50 px-4 py-1 text-sm font-medium uppercase tracking-[0.2em] text-slate-200">
          Plataforma COBRA
        </span>
        <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          Automatiza tus cobranzas con un agente de IA que habla con tus
          clientes por email y WhatsApp.
        </h1>
        <p className="text-balance text-lg text-slate-200 sm:text-xl">
          Centraliza facturas, contactos y seguimientos en un sistema
          multi-tenant que actualiza el estado de cada caso en tiempo real.
        </p>
        <form action={handleSignIn}>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
          >
            Entrar con Google
          </button>
        </form>
      </div>
    </main>
  );
}
