import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { cardClass } from "@/components/ui/styles";
import { NAV_ITEMS } from "@/lib/nav";
import { can } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { requireUser } from "@/server/session";

export const metadata = { title: "Inicio" };

// RF-08 (dashboard): el dueño del módulo reemplaza este contenido por las tarjetas y gráficas.
// Por ahora muestra a qué módulos tiene acceso el rol, lo que sirve para probar los permisos.
export default async function InicioPage() {
  const user = await requireUser();

  const modules = NAV_ITEMS.filter(
    (item) =>
      item.href !== "/inicio" &&
      (!item.anyOf || item.anyOf.some((action) => can(user.role, action))),
  );

  return (
    <>
      <PageHeader
        title={`Bienvenido, ${user.name}`}
        description={`Ingresaste como ${ROLE_LABELS[user.role]}.`}
      />

      <h2 className="mb-3 text-sm font-medium text-muted">Módulos disponibles para tu rol</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => (
          <Link key={item.href} href={item.href} className={`${cardClass} hover:border-brand`}>
            <p className="font-medium">{item.label}</p>
            <p className="mt-1 text-sm text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
