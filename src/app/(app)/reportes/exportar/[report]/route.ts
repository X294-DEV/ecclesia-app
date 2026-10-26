import { EXPORT_MIME, exportTable, type ExportFormat } from "@/lib/export";
import { can } from "@/lib/permissions";
import { REPORTS } from "@/server/reports";
import { getCurrentUser } from "@/server/session";

// Descarga de reportes: /reportes/exportar/<clave>?formato=xlsx|pdf (+ filtros del reporte).
export async function GET(request: Request, { params }: { params: Promise<{ report: string }> }) {
  const { report: key } = await params;
  const report = REPORTS[key];
  if (!report) return new Response("Reporte no encontrado", { status: 404 });

  const user = await getCurrentUser();
  if (!user) return new Response("No autenticado", { status: 401 });
  if (!can(user.role, report.permission)) return new Response("No autorizado", { status: 403 });

  const searchParams = new URL(request.url).searchParams;
  const format: ExportFormat = searchParams.get("formato") === "pdf" ? "pdf" : "xlsx";

  const table = await report.build(searchParams);
  const file = await exportTable(table, format);
  const filename = `${key}-${new Date().toISOString().slice(0, 10)}.${format}`;

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": EXPORT_MIME[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
