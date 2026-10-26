import { PageHeader } from "@/components/ui/page-header";
import { requireAnyCan } from "@/server/session";

export const metadata = { title: "Reportes" };

// MÓDULO EN CONSTRUCCIÓN: reemplaza este archivo con tu implementación.
// Patrón: requireAnyCan al inicio -> consulta con Prisma (db) -> DataTable / ActionForm.
// Ejemplo completo: src/app/(app)/usuarios/page.tsx y src/server/users.ts
export default async function Page() {
  await requireAnyCan(["reports:general", "reports:finance"]);

  return <PageHeader title="Reportes" description="RF-09 · Reportes y exportación a PDF o Excel · En construcción" />;
}
