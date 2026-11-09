import type { ReactNode } from "react";
import { NavLinks } from "@/components/layout/nav-links";
import { Arch, RoseWindow } from "@/components/ui/gothic";
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
  const church = await db.church.findUnique({ where: { id: 1 }, select: { name: true, logoUrl: true } });

  const items = NAV_ITEMS.filter(
    (item) => !item.anyOf || item.anyOf.some((action) => can(user.role, action)),
  ).map(({ href, label }) => ({ href, label }));

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      {/* En escritorio el menú queda fijo (ocupa toda la altura de la ventana) aunque la página haga scroll. */}
      <aside className="relative overflow-hidden border-b border-brand/40 bg-surface p-4 md:sticky md:top-0 md:h-screen md:self-start md:overflow-y-auto md:border-b-0 md:border-r">
        {/* El rosetón va en su propio contenedor recortado para no crear scroll dentro del menú. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
          <RoseWindow spin className="absolute -bottom-16 -left-16 h-72 w-72 opacity-[0.09]" />
        </div>
        <div className="relative mb-4 flex items-center gap-3">
          {church?.logoUrl && (
            // Data URL guardada en la BD: next/image no aporta nada aquí.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={church.logoUrl}
              alt={`Logo de ${church.name}`}
              className="h-10 w-10 shrink-0 rounded-md border border-brand/40 bg-background object-contain p-0.5"
            />
          )}
          {!church?.logoUrl && <Arch className="h-9 w-14 shrink-0" />}
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold text-brand">Ecclesia</p>
            {church?.name && <p className="truncate text-xs text-muted">{church.name}</p>}
          </div>
        </div>
        <div className="relative">
          <NavLinks items={items} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-brand/40 bg-surface px-6 py-3">
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
