"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";
import { requireCan } from "@/server/session";
import { assertEventInScope, eventScope } from "@/server/scope";

const rosterSchema = z.array(z.string().min(1)).min(1)
  .refine((ids) => new Set(ids).size === ids.length);

export async function saveAttendanceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCan("attendance:write");
  const eventId = z.string().min(1).safeParse(formData.get("eventId"));
  let roster: unknown;
  try {
    roster = JSON.parse(String(formData.get("roster") ?? ""));
  } catch {
    return { error: "Lista no válida. Recarga la página." };
  }
  const parsed = rosterSchema.safeParse(roster);
  if (!eventId.success || !parsed.success) return { error: "Selecciona un evento y recarga su lista." };

  await assertEventInScope(user, eventId.data);
  const scope = await eventScope(user);
  const values: Record<string, string> = {};
  const ids = new Set(parsed.data);
  for (const [key, value] of formData) {
    if (!key.startsWith("present_")) continue;
    if (!ids.has(key.slice(8)) || value !== "on") return { error: "Lista no válida. Recarga la página." };
    values[key] = "on";
  }

  const result = await db.$transaction(async (tx) => {
    const event = await tx.event.findFirst({
      where: { AND: [scope, { id: eventId.data, status: "ACTIVO" }] },
      select: { id: true },
    });
    if (!event) return { error: "El evento no está disponible para registrar asistencia.", values };

    // Reject a stale or partial roster instead of recording new members as absent.
    const active = await tx.member.findMany({ where: { active: true }, select: { id: true } });
    if (active.length !== ids.size || active.some((member) => !ids.has(member.id))) {
      return { error: "La lista de miembros cambió. Recarga la página antes de guardar.", values };
    }
    for (const member of active) {
      await tx.attendance.upsert({
        where: { eventId_memberId: { eventId: event.id, memberId: member.id } },
        create: { eventId: event.id, memberId: member.id, present: values[`present_${member.id}`] === "on" },
        update: { present: values[`present_${member.id}`] === "on" },
      });
    }
    return { success: `Asistencia guardada: ${Object.keys(values).length} presentes y ${active.length - Object.keys(values).length} ausentes.` };
  });

  if (result.success) {
    revalidatePath("/asistencia");
    revalidatePath("/inicio");
    revalidatePath("/reportes");
  }
  return result;
}
