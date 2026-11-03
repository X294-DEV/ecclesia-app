import { PageHeader } from "@/components/ui/page-header";
import { buttonGhostClass, cardClass, inputClass } from "@/components/ui/styles";
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
            {report.period ? (
              // Sin JS: el formulario GET manda desde/hasta y el botón elegido pone ?formato=.
              <form action={`/reportes/exportar/${key}`} method="get" className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <div>
                    <label htmlFor={`${key}-desde`} className="mb-1 block text-xs text-muted">
                      Desde
                    </label>
                    <input id={`${key}-desde`} name="desde" type="date" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor={`${key}-hasta`} className="mb-1 block text-xs text-muted">
                      Hasta
                    </label>
                    <input id={`${key}-hasta`} name="hasta" type="date" className={inputClass} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" name="formato" value="xlsx" className={buttonGhostClass}>
                    Excel
                  </button>
                  <button type="submit" name="formato" value="pdf" className={buttonGhostClass}>
                    PDF
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex gap-2">
                <a className={buttonGhostClass} href={`/reportes/exportar/${key}?formato=xlsx`}>
                  Excel
                </a>
                <a className={buttonGhostClass} href={`/reportes/exportar/${key}?formato=pdf`}>
                  PDF
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
