import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can, type Action, type Role } from "@/lib/permissions";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * Usuario de la sesión actual, verificado contra la base de datos
 * (si lo desactivan, deja de tener acceso aunque su cookie siga vigente).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

/** Exige sesión válida; si no, manda al login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Exige un permiso. Úsalo al inicio de CADA página y server action protegida:
 *   const user = await requireCan("members:write");
 */
export async function requireCan(action: Action): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, action)) redirect("/no-autorizado");
  return user;
}

/** Exige AL MENOS UNO de los permisos (p. ej. reportes generales o financieros). */
export async function requireAnyCan(actions: Action[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!actions.some((action) => can(user.role, action))) redirect("/no-autorizado");
  return user;
}
