import Link from "next/link";
import { MonthCalendar } from "@/components/events/month-calendar";
import { ActionForm } from "@/components/ui/action-form";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClass, buttonGhostClass, cardClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { can, scopeToOwnMinistry } from "@/lib/permissions";
import { saveEventAction, setEventStatusAction } from "@/server/events";
import { eventScope, ministryScope } from "@/server/scope";
import { requireCan } from "@/server/session";

export const metadata = { title: "Eventos" };
type Query = { vista?: string | string[]; mes?: string | string[]; editar?: string | string[] };

const TYPE_LABELS = { RELIGIOSO: "Religioso", ADMINISTRATIVO: "Administrativo" } as const;
const MONTH_FORMAT = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" });
const DATE_FORMAT = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" });

function parseMonth(value: string | string[] | undefined) {
  const match = typeof value === "string" ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value) : null;
  if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

const monthKey = (year: number, month: number) => {
  const date = new Date(Date.UTC(year, month, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

// RF-04: eventos de la iglesia, en lista y en calendario mensual.
export default async function EventosPage({ searchParams }: { searchParams: Promise<Query> }) {
  const user = await requireCan("events:read");
  const query = await searchParams;
  const writable = can(user.role, "events:write");
  const vista = query.vista === "calendario" ? "calendario" : "lista";
  const { year, month } = parseMonth(query.mes);
  const mes = monthKey(year, month);
  const editId = writable && typeof query.editar === "string" ? query.editar : "";

  const scope = await eventScope(user);
  const monthRange = { gte: new Date(Date.UTC(year, month, 1)), lt: new Date(Date.UTC(year, month + 1, 1)) };
  const found = await db.event.findMany({
    where: { ...scope, ...(vista === "calendario" ? { date: monthRange } : {}) },
    include: { responsible: { select: { name: true } }, ministry: { select: { name: true } } },
  });
  // Por día (UTC) y luego por hora: el seed guarda la fecha a medianoche local, los formularios a medianoche UTC.
  const sortKey = (event: (typeof found)[number]) => `${event.date.toISOString().slice(0, 10)} ${event.time}`;
  const events = found.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  const [members, ministries, editing] = writable
    ? await Promise.all([
        db.member.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
        db.ministry.findMany({ where: await ministryScope(user), orderBy: { name: "asc" }, select: { id: true, name: true } }),
        editId ? db.event.findFirst({ where: { id: editId, ...scope } }) : null,
      ])
    : [[], [], null];

  const viewParams = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (vista === "calendario") {
      params.set("vista", "calendario");
      params.set("mes", mes);
    }
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    return `/eventos?${params}`;
  };
  const listHref = vista === "calendario" ? `/eventos?vista=calendario&mes=${mes}` : "/eventos";
  const requireMinistry = scopeToOwnMinistry(user.role);

  return (
    <>
      <PageHeader title="Eventos" description="Actividades religiosas y administrativas de la iglesia.">
        <Link href="/eventos" className={vista === "lista" ? buttonClass : buttonGhostClass}>Lista</Link>
        <Link href={`/eventos?vista=calendario&mes=${mes}`} className={vista === "calendario" ? buttonClass : buttonGhostClass}>
          Calendario
        </Link>
      </PageHeader>

      <div className={writable ? "grid gap-6 xl:grid-cols-[1fr_360px]" : "grid gap-6"}>
        <div className="min-w-0">
          {vista === "calendario" ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Link href={`/eventos?vista=calendario&mes=${monthKey(year, month - 1)}`} className={buttonGhostClass}>← Anterior</Link>
                <h2 className="font-medium capitalize">{MONTH_FORMAT.format(new Date(Date.UTC(year, month, 1)))}</h2>
                <Link href={`/eventos?vista=calendario&mes=${monthKey(year, month + 1)}`} className={buttonGhostClass}>Siguiente →</Link>
              </div>
              <MonthCalendar
                year={year}
                month={month}
                events={events.map(event => ({
                  id: event.id,
                  title: event.title,
                  day: event.date.getUTCDate(),
                  time: event.time,
                  cancelled: event.status === "CANCELADO",
                  href: writable ? viewParams({ editar: event.id }) : undefined,
                }))}
              />
            </>
          ) : (
            <DataTable
              rows={events}
              getKey={event => event.id}
              empty="Todavía no hay eventos registrados."
              columns={[
                { header: "Fecha", cell: event => `${DATE_FORMAT.format(event.date)} · ${event.time}` },
                {
                  header: "Evento",
                  cell: event => (
                    <div className={event.status === "CANCELADO" ? "text-muted line-through" : ""}>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted">{event.location}</p>
                    </div>
                  ),
                },
                { header: "Tipo", cell: event => TYPE_LABELS[event.type] },
                { header: "Ministerio", cell: event => event.ministry?.name ?? <span className="text-muted">—</span> },
                { header: "Responsable", cell: event => event.responsible?.name ?? <span className="text-muted">—</span> },
                {
                  header: "Estado",
                  cell: event => (
                    <span className={event.status === "ACTIVO" ? "text-success" : "text-danger"}>
                      {event.status === "ACTIVO" ? "Activo" : "Cancelado"}
                    </span>
                  ),
                },
                ...(writable
                  ? [
                      {
                        header: "Acciones",
                        cell: (event: (typeof events)[number]) => (
                          <div className="flex flex-wrap items-start gap-2">
                            <Link className={buttonGhostClass} href={viewParams({ editar: event.id })}>Editar</Link>
                            <ActionForm
                              action={setEventStatusAction}
                              fields={[]}
                              hidden={{ id: event.id, status: event.status === "ACTIVO" ? "CANCELADO" : "ACTIVO" }}
                              submitLabel={event.status === "ACTIVO" ? "Cancelar" : "Reactivar"}
                            />
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </div>

        {writable && (
          <section className={`${cardClass} h-fit`}>
            <h2 className="mb-4 font-medium">{editing ? "Editar evento" : "Nuevo evento"}</h2>
            {editId && !editing && <p role="alert" className="mb-4 text-sm text-danger">No se encontró el evento solicitado.</p>}
            <ActionForm
              key={editing?.id ?? "new"}
              action={saveEventAction}
              hidden={editing ? { id: editing.id } : undefined}
              submitLabel={editing ? "Guardar cambios" : "Crear evento"}
              fields={[
                { name: "title", label: "Título", required: true, defaultValue: editing?.title },
                { name: "date", label: "Fecha", type: "date", required: true, defaultValue: editing?.date.toISOString().slice(0, 10) },
                { name: "time", label: "Hora", type: "time", required: true, defaultValue: editing?.time },
                { name: "location", label: "Lugar", required: true, defaultValue: editing?.location },
                {
                  name: "type",
                  label: "Tipo",
                  type: "select",
                  required: true,
                  defaultValue: editing?.type,
                  options: [
                    { value: "RELIGIOSO", label: TYPE_LABELS.RELIGIOSO },
                    { value: "ADMINISTRATIVO", label: TYPE_LABELS.ADMINISTRATIVO },
                  ],
                },
                {
                  name: "responsibleId",
                  label: "Responsable",
                  type: "select",
                  defaultValue: editing?.responsibleId ?? "",
                  options: members.map(member => ({ value: member.id, label: member.name })),
                },
                {
                  name: "ministryId",
                  label: requireMinistry ? "Ministerio" : "Ministerio (opcional)",
                  type: "select",
                  required: requireMinistry,
                  defaultValue: editing?.ministryId ?? "",
                  options: ministries.map(ministry => ({ value: ministry.id, label: ministry.name })),
                },
                { name: "description", label: "Descripción", type: "textarea", defaultValue: editing?.description ?? "" },
              ]}
            />
            {editing && <Link href={listHref} className={`${buttonGhostClass} mt-4`}>Cerrar edición</Link>}
          </section>
        )}
      </div>
    </>
  );
}
