import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ExportTable } from "@/lib/export";
import type { Action } from "@/lib/permissions";
import { parseIsoDate, periodWhere } from "@/lib/period";

// Registro de reportes (RF-09). Para agregar uno:
//   1. Escribe su `build` (consulta con Prisma -> ExportTable).
//   2. Agrégalo a REPORTS con su permiso.
// La página /reportes lo lista solo y la descarga en Excel/PDF sale de
// /reportes/exportar/<clave>?formato=xlsx|pdf sin tocar nada más.

export type ReportDefinition = {
  title: string;
  description: string;
  permission: Action;
  /** Si es true, /reportes muestra los campos ?desde= y ?hasta= antes de descargar. */
  period?: boolean;
  // `any` porque cada reporte tiene su propio tipo de fila.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: (params: URLSearchParams) => Promise<ExportTable<any>>;
};

/** Reporte general de miembros. Filtro opcional: ?estado=activos|inactivos */
async function membersReport(params: URLSearchParams) {
  const estado = params.get("estado");
  const members = await db.member.findMany({
    where: estado === "activos" ? { active: true } : estado === "inactivos" ? { active: false } : {},
    orderBy: { name: "asc" },
    select: {
      name: true,
      phone: true,
      email: true,
      joinDate: true,
      active: true,
      _count: { select: { ministries: true } },
    },
  });
  type Row = (typeof members)[number];

  const table: ExportTable<Row> = {
    title: "Reporte general de miembros",
    subtitle: `${members.length} miembros${estado ? ` (${estado})` : ""}`,
    rows: members,
    columns: [
      { header: "Nombre", value: (m) => m.name, width: 30 },
      { header: "Teléfono", value: (m) => m.phone, width: 16 },
      { header: "Correo", value: (m) => m.email, width: 30 },
      { header: "Fecha de ingreso", value: (m) => m.joinDate, format: "date", width: 16 },
      { header: "Estado", value: (m) => (m.active ? "Activo" : "Inactivo") },
      { header: "Ministerios", value: (m) => m._count.ministries },
    ],
  };
  return table;
}

/** RF-09: ingresos (donaciones) por periodo. Filtro opcional: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD */
async function incomeReport(params: URLSearchParams) {
  const desde = parseIsoDate(params.get("desde"));
  const hasta = parseIsoDate(params.get("hasta"));
  const donations = await db.donation.findMany({
    where: periodWhere(desde, hasta),
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: { date: true, concept: true, method: true, amount: true, member: { select: { name: true } } },
  });
  type Row = (typeof donations)[number];

  const total = donations.reduce((sum, donation) => sum.plus(donation.amount), new Prisma.Decimal(0));
  const range = desde || hasta ? `del ${desde || "inicio"} al ${hasta || "hoy"}` : "todas las fechas";
  const methods = { EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia", TARJETA: "Tarjeta", OTRO: "Otro" } as const;

  const table: ExportTable<Row> = {
    title: "Reporte de ingresos por periodo",
    subtitle: `${donations.length} donaciones (${range})`,
    rows: donations,
    columns: [
      { header: "Fecha", value: (d) => d.date, format: "date", width: 14 },
      { header: "Concepto", value: (d) => d.concept, width: 30 },
      { header: "Método", value: (d) => methods[d.method], width: 16 },
      { header: "Miembro", value: (d) => d.member?.name ?? "Anónimo", width: 28 },
      { header: "Monto", value: (d) => d.amount.toNumber(), format: "money", width: 16 },
    ],
    footer: ["Total", null, null, null, total.toNumber()],
  };
  return table;
}

/** RF-09: asistencia por evento. Filtro opcional: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD (fecha del evento) */
async function attendanceReport(params: URLSearchParams) {
  const desde = parseIsoDate(params.get("desde"));
  const hasta = parseIsoDate(params.get("hasta"));
  const dayAfterHasta = hasta ? new Date(new Date(`${hasta}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000) : null;
  const events = await db.event.findMany({
    where:
      desde || hasta
        ? {
            date: {
              ...(desde ? { gte: new Date(`${desde}T00:00:00.000Z`) } : {}),
              ...(dayAfterHasta ? { lt: dayAfterHasta } : {}),
            },
          }
        : {},
    orderBy: [{ date: "desc" }, { time: "desc" }],
    select: {
      title: true,
      date: true,
      time: true,
      type: true,
      status: true,
      ministry: { select: { name: true } },
      attendances: { select: { present: true } },
    },
  });
  type Row = (typeof events)[number];

  const present = (event: Row) => event.attendances.filter((a) => a.present).length;
  const registered = (event: Row) => event.attendances.length;
  const totalPresent = events.reduce((sum, event) => sum + present(event), 0);
  const totalRegistered = events.reduce((sum, event) => sum + registered(event), 0);
  const range = desde || hasta ? `del ${desde || "inicio"} al ${hasta || "hoy"}` : "todas las fechas";

  const table: ExportTable<Row> = {
    title: "Reporte de asistencia por evento",
    subtitle: `${events.length} eventos (${range})`,
    rows: events,
    columns: [
      { header: "Fecha", value: (e) => e.date, format: "date", width: 14 },
      { header: "Hora", value: (e) => e.time, width: 8 },
      { header: "Evento", value: (e) => e.title, width: 32 },
      { header: "Tipo", value: (e) => (e.type === "RELIGIOSO" ? "Religioso" : "Administrativo"), width: 16 },
      { header: "Ministerio", value: (e) => e.ministry?.name ?? "General", width: 22 },
      { header: "Estado", value: (e) => (e.status === "CANCELADO" ? "Cancelado" : "Activo"), width: 12 },
      { header: "Presentes", value: (e) => present(e) },
      { header: "Ausentes", value: (e) => registered(e) - present(e) },
      { header: "Registrados", value: (e) => registered(e) },
      {
        header: "% asistencia",
        value: (e) => (registered(e) ? `${Math.round((present(e) / registered(e)) * 100)}%` : "—"),
      },
    ],
    footer: [
      "Total",
      null,
      null,
      null,
      null,
      null,
      totalPresent,
      totalRegistered - totalPresent,
      totalRegistered,
      totalRegistered ? `${Math.round((totalPresent / totalRegistered) * 100)}%` : "—",
    ],
  };
  return table;
}

export const REPORTS: Record<string, ReportDefinition> = {
  miembros: {
    title: "Reporte general de miembros",
    description: "Todos los miembros con contacto, fecha de ingreso y estado.",
    permission: "reports:general",
    build: membersReport,
  },
  ingresos: {
    title: "Reporte de ingresos por periodo",
    description: "Donaciones con fecha, concepto, método, miembro (o anónimo) y total.",
    permission: "reports:finance",
    period: true,
    build: incomeReport,
  },
  asistencia: {
    title: "Reporte de asistencia por evento",
    description: "Presentes, ausentes y porcentaje de asistencia de cada evento.",
    permission: "reports:general",
    period: true,
    build: attendanceReport,
  },
  // Pendientes (cada dueño agrega el suyo con el mismo patrón):
  // ministerios:  D · participación por ministerio   · "reports:general"
};
