import { PageHeader } from "@/components/ui/page-header";
import { requireCan } from "@/server/session";

export const metadata = { title: "Miembros" };

// MÓDULO EN CONSTRUCCIÓN: reemplaza este archivo con tu implementación.
// Patrón: requireCan al inicio -> consulta con Prisma (db) -> DataTable / ActionForm.
// Ejemplo completo: src/app/(app)/usuarios/page.tsx y src/server/users.ts
export default async function Page() {
  await requireCan("members:read");

  return <PageHeader title="Miembros" description="RF-02 · Gestión de miembros · En construcción" />;
}
