import Link from "next/link";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ActionForm } from "@/components/ui/action-form";
import { DataTable } from "@/components/ui/data-table";
import { GothicDivider } from "@/components/ui/gothic";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClass, buttonGhostClass, cardClass, inputClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { can } from "@/lib/permissions";
import { createDonationAction } from "@/server/donations";
import { requireCan } from "@/server/session";

export const metadata = { title: "Donaciones" };

const METHOD_LABELS = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  OTRO: "Otro",
} as const;
const METHOD_OPTIONS = Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }));

type Query = { desde?: string | string[]; hasta?: string | string[] };

/** Devuelve la fecha solo si es un YYYY-MM-DD válido; cualquier otra cosa se ignora. */
function parseDate(value: string | string[] | undefined) {
  const parsed = z.iso.date().safeParse(typeof value === "string" ? value : "");
  return parsed.success ? parsed.data : "";
}

// RF-06: donaciones. Solo roles con donations:read ven montos (admin, pastor y tesorero).
export default async function DonacionesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const user = await requireCan("donations:read");
  const canWrite = can(user.role, "donations:write");

  const query = await searchParams;
  const desde = parseDate(query.desde);
  const hasta = parseDate(query.hasta);

  // El día "hasta" se incluye completo (hasta antes de la medianoche UTC del día siguiente),
  // porque una donación puede traer hora y no solo la fecha.
  const dayAfterHasta = hasta ? new Date(new Date(`${hasta}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000) : null;
  const where: Prisma.DonationWhereInput =
    desde || hasta
      ? {
          date: {
            ...(desde ? { gte: new Date(`${desde}T00:00:00.000Z`) } : {}),
            ...(dayAfterHasta ? { lt: dayAfterHasta } : {}),
          },
        }
      : {};

  const donations = await db.donation.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      date: true,
      amount: true,
      concept: true,
      method: true,
      member: { select: { name: true } },
    },
  });
  const members = canWrite
    ? await db.member.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];

  // Total del periodo y suma por mes con Decimal (sin errores de punto flotante).
  let total = new Prisma.Decimal(0);
  const byMonth = new Map<string, Prisma.Decimal>();
  for (const donation of donations) {
    total = total.plus(donation.amount);
    const key = donation.date.toISOString().slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? new Prisma.Decimal(0)).plus(donation.amount));
  }
  const monthly = [...byMonth].map(([month, amount]) => ({ month, amount }));

  const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" });
  const monthFormat = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

  return (
    <>
      <PageHeader title="Donaciones" description="Aportaciones registradas, total del periodo y resumen mensual." />

      <form action="/donaciones" method="get" className={`${cardClass} mb-6 flex flex-wrap items-end gap-4`}>
        <div>
          <label htmlFor="donation-from" className="mb-1 block text-sm font-medium">
            Desde
          </label>
          <input id="donation-from" name="desde" type="date" defaultValue={desde} className={inputClass} />
        </div>
        <div>
          <label htmlFor="donation-to" className="mb-1 block text-sm font-medium">
            Hasta
          </label>
          <input id="donation-to" name="hasta" type="date" defaultValue={hasta} className={inputClass} />
        </div>
        <button type="submit" className={buttonClass}>
          Filtrar
        </button>
        <Link href="/donaciones" className={buttonGhostClass}>
          Limpiar
        </Link>
      </form>

      <div className={canWrite ? "grid gap-6 xl:grid-cols-[1fr_360px]" : "grid gap-6"}>
        <div className="min-w-0 space-y-6">
          <section className={`${cardClass} flex flex-wrap items-baseline justify-between gap-2`}>
            <div>
              <p className="text-sm text-muted">
                Total del periodo{desde || hasta ? " filtrado" : " (todas las donaciones)"}
              </p>
              <p className="font-display text-3xl text-brand">{formatMoney(total)}</p>
            </div>
            <p className="text-sm text-muted">{donations.length} donación(es)</p>
          </section>

          <DataTable
            rows={donations}
            getKey={(donation) => donation.id}
            empty="No hay donaciones en este periodo."
            columns={[
              { header: "Fecha", cell: (donation) => dateFormat.format(donation.date) },
              { header: "Concepto", cell: (donation) => donation.concept },
              { header: "Método", cell: (donation) => METHOD_LABELS[donation.method] },
              {
                header: "Miembro",
                cell: (donation) => donation.member?.name ?? <span className="text-muted">Anónimo</span>,
              },
              {
                header: "Monto",
                className: "text-right whitespace-nowrap",
                cell: (donation) => formatMoney(donation.amount),
              },
            ]}
          />

          <GothicDivider />

          <h2 className="font-display text-lg text-brand">Resumen mensual</h2>
          <DataTable
            rows={monthly}
            getKey={(row) => row.month}
            empty="Sin datos para resumir."
            columns={[
              {
                header: "Mes",
                cell: (row) => <span className="capitalize">{monthFormat.format(new Date(`${row.month}-01T00:00:00.000Z`))}</span>,
              },
              { header: "Total", className: "text-right", cell: (row) => formatMoney(row.amount) },
            ]}
          />
        </div>

        {canWrite && (
          <section className={`${cardClass} h-fit`}>
            <h2 className="mb-4 font-medium">Registrar donación</h2>
            <ActionForm
              action={createDonationAction}
              submitLabel="Registrar donación"
              fields={[
                { name: "date", label: "Fecha", type: "date", required: true, defaultValue: today },
                { name: "amount", label: "Monto (MXN)", type: "number", step: "0.01", required: true, placeholder: "0.00" },
                { name: "concept", label: "Concepto", required: true, placeholder: "Diezmo, ofrenda..." },
                { name: "method", label: "Método", type: "select", required: true, options: METHOD_OPTIONS },
                {
                  name: "memberId",
                  label: "Miembro (vacío = anónima)",
                  type: "select",
                  options: members.map((member) => ({ value: member.id, label: member.name })),
                },
              ]}
            />
          </section>
        )}
      </div>
    </>
  );
}
