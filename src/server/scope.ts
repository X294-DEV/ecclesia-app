import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { scopeToOwnMinistry } from "@/lib/permissions";
import type { CurrentUser } from "@/server/session";

// Alcance del coordinador: solo ve y edita lo de los ministerios que coordina
// (Ministry.coordinatorId = el miembro vinculado a su usuario). Los demás roles ven todo.
//
// Uso en ministerios / eventos / asistencia:
//   const user = await requireCan("events:read");
//   const events = await db.event.findMany({ where: await eventScope(user) });
// Y en server actions de escritura, antes de guardar:
//   await assertMinistryInScope(user, ministryId);

/** IDs de los ministerios del coordinador, o `null` si el rol no tiene restricción. */
export async function ownMinistryIds(user: CurrentUser): Promise<string[] | null> {
  if (!scopeToOwnMinistry(user.role)) return null;

  const row = await db.user.findUnique({ where: { id: user.id }, select: { memberId: true } });
  if (!row?.memberId) return []; // coordinador sin miembro vinculado: no ve nada

  const ministries = await db.ministry.findMany({
    where: { coordinatorId: row.memberId },
    select: { id: true },
  });
  return ministries.map((ministry) => ministry.id);
}

export async function ministryScope(user: CurrentUser): Promise<Prisma.MinistryWhereInput> {
  const ids = await ownMinistryIds(user);
  return ids === null ? {} : { id: { in: ids } };
}

export async function eventScope(user: CurrentUser): Promise<Prisma.EventWhereInput> {
  const ids = await ownMinistryIds(user);
  return ids === null ? {} : { ministryId: { in: ids } };
}

export async function attendanceScope(user: CurrentUser): Promise<Prisma.AttendanceWhereInput> {
  const ids = await ownMinistryIds(user);
  return ids === null ? {} : { event: { ministryId: { in: ids } } };
}

/** Para escrituras: manda a /no-autorizado si el ministerio no es del coordinador. */
export async function assertMinistryInScope(user: CurrentUser, ministryId: string | null | undefined) {
  const ids = await ownMinistryIds(user);
  if (ids !== null && (!ministryId || !ids.includes(ministryId))) redirect("/no-autorizado");
}

/** Igual que assertMinistryInScope, pero a partir de un evento (p. ej. al pasar lista). */
export async function assertEventInScope(user: CurrentUser, eventId: string) {
  const ids = await ownMinistryIds(user);
  if (ids === null) return;
  const event = await db.event.findUnique({ where: { id: eventId }, select: { ministryId: true } });
  if (!event?.ministryId || !ids.includes(event.ministryId)) redirect("/no-autorizado");
}
