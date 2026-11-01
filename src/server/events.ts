"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";
import { scopeToOwnMinistry } from "@/lib/permissions";
import { assertEventInScope, assertMinistryInScope } from "@/server/scope";
import { requireCan } from "@/server/session";

const FIELDS = ["title", "date", "time", "location", "description", "type", "responsibleId", "ministryId"] as const;

const eventSchema = z.object({
  title: z.string().trim().min(2, "Escribe el título del evento.").max(150, "Máximo 150 caracteres."),
  date: z.iso.date("Selecciona una fecha válida.").transform(value => new Date(`${value}T00:00:00.000Z`)),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Escribe una hora válida (HH:mm)."),
  location: z.string().trim().min(2, "Escribe el lugar.").max(150, "Máximo 150 caracteres."),
  description: z.string().trim().max(1000, "Máximo 1000 caracteres."),
  type: z.enum(["RELIGIOSO", "ADMINISTRATIVO"], { error: "Selecciona el tipo de evento." }),
  responsibleId: z.string(),
  ministryId: z.string(),
});

function revalidateEvents() {
  revalidatePath("/eventos");
  revalidatePath("/asistencia");
  revalidatePath("/ministerios");
  revalidatePath("/anuncios");
  revalidatePath("/inicio");
  revalidatePath("/reportes");
}

/** RF-04: crear o editar un evento (con `id` oculto edita). */
export async function saveEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCan("events:write");
  const values = Object.fromEntries(FIELDS.map(key => [key, String(formData.get(key) ?? "").trim()]));
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const id = String(formData.get("id") ?? "");
  const { responsibleId, ministryId, description, ...rest } = parsed.data;

  // El coordinador solo trabaja con eventos de sus ministerios (y el ministerio es obligatorio).
  if (scopeToOwnMinistry(user.role) && !ministryId) {
    return { error: "Revisa los campos marcados.", fieldErrors: { ministryId: ["Selecciona un ministerio."] }, values };
  }
  if (id) await assertEventInScope(user, id);
  await assertMinistryInScope(user, ministryId || null);

  if (responsibleId && !(await db.member.findFirst({ where: { id: responsibleId, active: true }, select: { id: true } }))) {
    return { error: "Revisa los campos marcados.", fieldErrors: { responsibleId: ["El responsable ya no está disponible."] }, values };
  }
  if (ministryId && !(await db.ministry.findUnique({ where: { id: ministryId }, select: { id: true } }))) {
    return { error: "Revisa los campos marcados.", fieldErrors: { ministryId: ["El ministerio ya no está disponible."] }, values };
  }

  const data = { ...rest, description: description || null, responsibleId: responsibleId || null, ministryId: ministryId || null };
  if (id) {
    const result = await db.event.updateMany({ where: { id }, data });
    if (!result.count) return { error: "El evento ya no está disponible. Actualiza la página.", values };
  } else {
    await db.event.create({ data });
  }

  revalidateEvents();
  return { success: id ? "Evento actualizado." : "Evento creado." };
}

/** Cancelar (status CANCELADO) o reactivar un evento. Los eventos nunca se borran. */
export async function setEventStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCan("events:write");
  const parsed = z
    .object({ id: z.string().min(1), status: z.enum(["ACTIVO", "CANCELADO"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Solicitud no válida. Actualiza la página." };

  await assertEventInScope(user, parsed.data.id);
  const result = await db.event.updateMany({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  if (!result.count) return { error: "El evento ya no está disponible." };

  revalidateEvents();
  return { success: parsed.data.status === "CANCELADO" ? "Evento cancelado." : "Evento reactivado." };
}
