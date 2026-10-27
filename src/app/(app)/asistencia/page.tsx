import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClass, buttonGhostClass, cardClass, inputClass } from "@/components/ui/styles";
import { attendanceDateRange, attendancePeriod } from "@/lib/attendance-dates";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { saveAttendanceAction } from "@/server/attendance";
import { attendanceScope, eventScope } from "@/server/scope";
import { requireCan } from "@/server/session";

export const metadata = { title: "Asistencia" };
type Query = { evento?: string | string[]; desde?: string | string[]; hasta?: string | string[] };
type Summary = { period: string; present: number; absent: number; events: Set<string> };
const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" });

function SummaryTable({ title, rows }: { title: string; rows: Summary[] }) {
  return <section className="space-y-3">
    <h2 className="text-lg font-medium">{title}</h2>
    <DataTable rows={rows} getKey={row => row.period} empty="No hay asistencias registradas en este periodo." columns={[
      { header: "Periodo", cell: row => row.period },
      { header: "Eventos con lista", cell: row => row.events.size },
      { header: "Presentes", cell: row => row.present },
      { header: "Ausentes", cell: row => row.absent },
      { header: "% asistencia", cell: row => `${(100 * row.present / (row.present + row.absent)).toFixed(1)} %` },
    ]} />
  </section>;
}

export default async function AsistenciaPage({ searchParams }: { searchParams: Promise<Query> }) {
  const user = await requireCan("attendance:read");
  const query = await searchParams;
  const eventId = typeof query.evento === "string" ? query.evento : "";
  const desde = typeof query.desde === "string" ? query.desde : "";
  const hasta = typeof query.hasta === "string" ? query.hasta : "";
  const range = attendanceDateRange(desde, hasta);
  const scopedEvents = await eventScope(user);
  const scopedAttendance = await attendanceScope(user);
  const events = await db.event.findMany({
    where: scopedEvents,
    orderBy: [{ date: "desc" }, { title: "asc" }],
    select: { id: true, title: true, date: true, time: true, status: true },
  });
  const selected = events.find(event => event.id === eventId);
  const records = selected ? await db.attendance.findMany({
    where: { AND: [scopedAttendance, { eventId: selected.id }] },
    include: { member: { select: { name: true, active: true } } },
    orderBy: { member: { name: "asc" } },
  }) : [];
  const writable = can(user.role, "attendance:write");
  const activeMembers = selected?.status === "ACTIVO" && writable
    ? await db.member.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }) : [];
  const recorded = new Map(records.map(record => [record.memberId, record.present]));
  const groups = range ? await db.attendance.groupBy({
    by: ["eventId", "present"],
    where: { AND: [scopedAttendance, { event: { date: range } }] },
    _count: { _all: true },
  }) : [];
  const counts = new Map<string, { present: number; absent: number }>();
  const weekly = new Map<string, Summary>();
  const monthly = new Map<string, Summary>();
  for (const group of groups) {
    const event = events.find(event => event.id === group.eventId);
    if (!event) continue;
    const count = group._count._all;
    const total = counts.get(event.id) ?? { present: 0, absent: 0 };
    total[group.present ? "present" : "absent"] += count;
    counts.set(event.id, total);
    for (const [unit, summaries] of [["week", weekly], ["month", monthly]] as const) {
      const period = attendancePeriod(event.date, unit);
      const row = summaries.get(period) ?? { period, present: 0, absent: 0, events: new Set<string>() };
      row[group.present ? "present" : "absent"] += count;
      row.events.add(event.id);
      summaries.set(period, row);
    }
  }
  const history = range ? events.filter(event => (!range.gte || event.date >= range.gte) && (!range.lt || event.date < range.lt)) : [];
  const linkToEvent = (id: string) => `/asistencia?${new URLSearchParams({ evento: id, desde, hasta })}`;
  const sorted = (rows: Map<string, Summary>) => [...rows.values()].sort((a, b) => b.period.localeCompare(a.period));

  return <>
    <PageHeader title="Asistencia" description="Pase de lista, historial por evento y resúmenes de asistencia." />
    <div className="space-y-6">
      <form action="/asistencia" method="get" className={`${cardClass} flex flex-wrap items-end gap-4`}>
        <div className="min-w-48 flex-1">
          <label htmlFor="attendance-event" className="mb-1 block text-sm font-medium">Evento activo</label>
          <select id="attendance-event" name="evento" defaultValue={selected?.id ?? ""} className={inputClass}>
            <option value="">Selecciona un evento</option>
            {selected?.status === "CANCELADO" && <option value={selected.id}>{selected.title} (cancelado, solo historial)</option>}
            {events.filter(event => event.status === "ACTIVO").map(event => <option key={event.id} value={event.id}>{dateFormat.format(event.date)} · {event.time} · {event.title}</option>)}
          </select>
        </div>
        <div><label htmlFor="attendance-from" className="mb-1 block text-sm font-medium">Desde</label><input id="attendance-from" name="desde" type="date" defaultValue={desde} className={inputClass} /></div>
        <div><label htmlFor="attendance-to" className="mb-1 block text-sm font-medium">Hasta</label><input id="attendance-to" name="hasta" type="date" defaultValue={hasta} className={inputClass} /></div>
        <button type="submit" className={buttonClass}>Consultar</button>
        <Link href="/asistencia" className={buttonGhostClass}>Limpiar</Link>
      </form>
      {!range && <p role="alert" className="text-danger">Escribe fechas válidas y una fecha final igual o posterior a la inicial.</p>}
      {eventId && !selected && <p role="alert" className="text-danger">El evento no está disponible.</p>}
      {!events.length && <p className={cardClass}>No hay eventos disponibles para tu usuario.</p>}
      {selected && <section className={`${cardClass} space-y-4`}>
        <h2 className="text-lg font-medium">{selected.title} · {dateFormat.format(selected.date)} · {selected.time}</h2>
        {selected.status === "CANCELADO" ? <p>Evento cancelado. Su historial se conserva y no admite cambios.</p> : writable ? <>
          <h3 className="font-medium">Pase de lista</h3>
          <p className="text-sm text-muted">Marca a los presentes. Al guardar, las casillas sin marcar se registran como ausentes. Los cambios actualizan la lista existente.</p>
          {activeMembers.length ? <ActionForm key={selected.id} action={saveAttendanceAction}
            hidden={{ eventId: selected.id, roster: JSON.stringify(activeMembers.map(member => member.id)) }}
            fields={activeMembers.map(member => ({ name: `present_${member.id}`, label: member.name, type: "checkbox", defaultValue: recorded.get(member.id) ?? false }))}
            submitLabel="Guardar asistencia" columns={2} /> : <p>No hay miembros activos para pasar lista.</p>}
        </> : <p className="text-sm text-muted">Tu rol permite consultar la asistencia.</p>}
        <h3 className="font-medium">Historial de la lista guardada</h3>
        <DataTable rows={records} getKey={record => record.id} empty="Todavía no se ha registrado asistencia para este evento." columns={[
          { header: "Miembro", cell: record => record.member.name },
          { header: "Estado del miembro", cell: record => record.member.active ? "Activo" : "Inactivo" },
          { header: "Asistencia", cell: record => record.present ? "Presente" : "Ausente" },
        ]} />
      </section>}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Historial por evento</h2>
        <p className="text-sm text-muted">El rango filtra el historial de eventos y los resúmenes. La lista seleccionada se consulta de forma independiente. Los porcentajes usan únicamente registros guardados.</p>
        <DataTable rows={history} getKey={event => event.id} empty="No hay eventos en el rango seleccionado." columns={[
          { header: "Fecha", cell: event => dateFormat.format(event.date) },
          { header: "Evento", cell: event => <Link href={linkToEvent(event.id)} className="underline">{event.title}</Link> },
          { header: "Estado", cell: event => event.status === "ACTIVO" ? "Activo" : "Cancelado" },
          { header: "Presentes", cell: event => counts.get(event.id)?.present ?? "Sin registrar" },
          { header: "Ausentes", cell: event => counts.get(event.id)?.absent ?? "Sin registrar" },
        ]} />
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <SummaryTable title="Resumen semanal (semana desde el lunes)" rows={sorted(weekly)} />
        <SummaryTable title="Resumen mensual" rows={sorted(monthly)} />
      </div>
    </div>
  </>;
}
