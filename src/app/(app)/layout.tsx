import type { ReactNode } from "react";
import { NavLinks } from "@/components/layout/nav-links";
import { buttonGhostClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { NAV_ITEMS } from "@/lib/nav";
import { can } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { logoutAction } from "@/server/auth-actions";
import { requireUser } from "@/server/session";

// Layout de toda la zona autenticada: exige sesión y arma el menú según el rol.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const church = await db.church.findUnique({ where: { id: 1 }, select: { name: true } });

  const items = NAV_ITEMS.filter(
    (item) => !item.anyOf || item.anyOf.some((action) => can(user.role, action)),
  ).map(({ href, label }) => ({ href, label }));

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-surface p-4 md:border-b-0 md:border-r">
        <div className="mb-4">
          <p className="text-lg font-semibold text-brand">Ecclesia</p>
          {church?.name && <p className="text-xs text-muted">{church.name}</p>}
        </div>
        <NavLinks items={items} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-6 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className={buttonGhostClass}>
              Cerrar sesión
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
