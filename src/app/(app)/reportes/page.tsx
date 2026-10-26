import { PageHeader } from "@/components/ui/page-header";
import { buttonGhostClass, cardClass } from "@/components/ui/styles";
import { can } from "@/lib/permissions";
import { REPORTS } from "@/server/reports";
import { requireAnyCan } from "@/server/session";

export const metadata = { title: "Reportes" };

// RF-09: lista los reportes de REPORTS (src/server/reports.ts) que el rol puede ver,
// con descarga en Excel y PDF. Para agregar un reporte basta registrarlo ahí.
export default async function ReportesPage() {
  const user = await requireAnyCan(["reports:general", "reports:finance"]);

  const reports = Object.entries(REPORTS).filter(([, report]) => can(user.role, report.permission));

  return (
    <>
      <PageHeader title="Reportes" description="Descarga los reportes en Excel o PDF." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.length === 0 && <p className="text-sm text-muted">Aún no hay reportes disponibles para tu rol.</p>}
        {reports.map(([key, report]) => (
          <div key={key} className={cardClass}>
            <h2 className="font-medium">{report.title}</h2>
            <p className="mt-1 mb-4 text-sm text-muted">{report.description}</p>
            <div className="flex gap-2">
              <a className={buttonGhostClass} href={`/reportes/exportar/${key}?formato=xlsx`}>
                Excel
              </a>
              <a className={buttonGhostClass} href={`/reportes/exportar/${key}?formato=pdf`}>
                PDF
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
