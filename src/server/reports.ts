import { db } from "@/lib/db";
import type { ExportTable } from "@/lib/export";
import type { Action } from "@/lib/permissions";

// Registro de reportes (RF-09). Para agregar uno:
//   1. Escribe su `build` (consulta con Prisma -> ExportTable).
//   2. Agrégalo a REPORTS con su permiso.
// La página /reportes lo lista solo y la descarga en Excel/PDF sale de
// /reportes/exportar/<clave>?formato=xlsx|pdf sin tocar nada más.

export type ReportDefinition = {
  title: string;
  description: string;
  permission: Action;
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

export const REPORTS: Record<string, ReportDefinition> = {
  miembros: {
    title: "Reporte general de miembros",
    description: "Todos los miembros con contacto, fecha de ingreso y estado.",
    permission: "reports:general",
    build: membersReport,
  },
  // Pendientes (cada dueño agrega el suyo con el mismo patrón):
  // asistencia:   B · asistencia por evento          · "reports:general"
  // ministerios:  D · participación por ministerio   · "reports:general"
  // ingresos:     C · ingresos por periodo           · "reports:finance"
};
