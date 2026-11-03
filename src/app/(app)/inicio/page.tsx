import Link from "next/link";
import { MonthlyBarChart } from "@/components/ui/charts";
import { GothicDivider, OgivePanel, RoseWindow, TraceryCorners } from "@/components/ui/gothic";
import { PageHeader } from "@/components/ui/page-header";
import { cardClass } from "@/components/ui/styles";
import { formatMoney } from "@/lib/money";
import { can } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { getFinanceStats, getGeneralStats } from "@/server/dashboard";
import { requireUser } from "@/server/session";

export const metadata = { title: "Inicio" };

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={`${cardClass} relative pt-10 text-center`}>
      <TraceryCorners />
      <p className="font-display text-4xl text-brand">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
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

          <section className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="font-display text-xl text-brand">Próximos eventos</h2>
              {can(user.role, "events:read") && (
                <Link href="/eventos?vista=calendario" className="text-sm text-brand underline underline-offset-4">
                  Ver calendario →
                </Link>
              )}
            </div>
            {general.upcomingEvents.length === 0 ? (
              <p className={`${cardClass} text-center text-sm text-muted`}>No hay eventos próximos.</p>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {general.upcomingEvents.slice(0, 3).map((event) => (
                  <li key={event.id} className="gothic-tilt min-w-0">
                    <OgivePanel
                      draw={false}
                      bodyClassName="px-4 pb-4 pt-2 text-center"
                      emblem={<RoseWindow spin className="h-9 w-9 opacity-80" />}
                    >
                      <h3 className="font-display text-lg leading-snug">{event.title}</h3>
                      <p className="mt-1 text-sm text-brand">
                        <span className="inline-block first-letter:uppercase">{dateFormat.format(event.date)}</span> ·{" "}
                        {event.time}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">{event.location}</p>
                    </OgivePanel>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${cardClass} min-w-0`}>
            <h2 className="mb-4 font-display text-lg text-brand">Asistencia por mes</h2>
            <MonthlyBarChart data={general.attendanceByMonth} label="Asistencias" />
          </section>
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
