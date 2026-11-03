import { MonthlyBarChart } from "@/components/ui/charts";
import { GothicDivider } from "@/components/ui/gothic";
import { PageHeader } from "@/components/ui/page-header";
import { cardClass, cardFeaturedClass } from "@/components/ui/styles";
import { formatMoney } from "@/lib/money";
import { can } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { getFinanceStats, getGeneralStats } from "@/server/dashboard";
import { requireUser } from "@/server/session";

export const metadata = { title: "Inicio" };

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={cardClass}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl text-brand">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

// RF-08: dashboard. Lo general (dashboard:general) y lo financiero (dashboard:finance) se
// calculan y se muestran por separado: el tesorero solo ve finanzas.
export default async function InicioPage() {
  const user = await requireUser();
  const showGeneral = can(user.role, "dashboard:general");
  const showFinance = can(user.role, "dashboard:finance");

  const [general, finance] = await Promise.all([
    showGeneral ? getGeneralStats(user) : null,
    showFinance ? getFinanceStats() : null,
  ]);

  const dateFormat = new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <>
      <PageHeader title={`Bienvenido, ${user.name}`} description={`Ingresaste como ${ROLE_LABELS[user.role]}.`} />

      {!general && !finance && <p className="text-sm text-muted">Tu rol no tiene indicadores disponibles.</p>}

      {general && (
        <section aria-label="Resumen general" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Miembros activos" value={general.activeMembers} />
            <StatCard label="Asistencias registradas" value={general.presentCount} hint="Presentes en todos los eventos" />
            <StatCard label="Ministerios" value={general.ministries} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className={`${cardFeaturedClass} min-w-0`}>
              <h2 className="mb-4 font-display text-lg text-brand">Próximos eventos</h2>
              {general.upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted">No hay eventos próximos.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {general.upcomingEvents.map((event) => (
                    <li key={event.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">{event.title}</p>
                        <p className="truncate text-xs text-muted">{event.location}</p>
                      </div>
                      <p className="shrink-0 text-right text-muted">
                        <span className="inline-block first-letter:uppercase">{dateFormat.format(event.date)}</span>
                        <br />
                        {event.time}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`${cardClass} min-w-0`}>
              <h2 className="mb-4 font-display text-lg text-brand">Asistencia por mes</h2>
              <MonthlyBarChart data={general.attendanceByMonth} label="Asistencias" />
            </section>
          </div>
        </section>
      )}

      {general && finance && <GothicDivider className="my-8" />}

      {finance && (
        <section aria-label="Resumen financiero" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Ingresos del mes" value={formatMoney(finance.monthIncome)} hint={finance.monthLabel} />
          </div>
          <section className={`${cardClass} min-w-0`}>
            <h2 className="mb-4 font-display text-lg text-brand">Ingresos por mes</h2>
            <MonthlyBarChart data={finance.incomeByMonth} label="Ingresos" money color="var(--accent)" />
          </section>
        </section>
      )}
    </>
  );
}
