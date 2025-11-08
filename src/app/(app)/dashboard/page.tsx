import { getCurrentSession } from "@/lib/services/session";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  return (
    <section className="flex flex-col gap-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          ¡Bienvenido a COBRA!
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Estás autenticado como{" "}
          <span className="font-medium text-slate-900">
            {session?.user?.email ?? session?.user?.name ?? "usuario"}
          </span>
          .
        </p>
        {session?.organization ? (
          <p className="mt-1 text-sm text-slate-600">
            Organización activa:{" "}
            <span className="font-medium text-slate-900">
              {session.organization.name}
            </span>
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
          Aquí verás el estado de tus facturas y el timeline de cobranzas una
          vez que completemos las próximas fases.
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
          Próximamente: flujos automáticos de email, WhatsApp y acciones del
          agente de IA.
        </div>
      </div>
    </section>
  );
}

