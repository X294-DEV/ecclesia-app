"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";
import { assertMinistryInScope } from "@/server/scope";
import { requireCan } from "@/server/session";

const FIELDS = ["name", "description", "coordinatorId"] as const;

const ministrySchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del ministerio.").max(100, "Máximo 100 caracteres."),
  description: z.string().trim().max(500, "Máximo 500 caracteres."),
  coordinatorId: z.string(),
});

const linkSchema = z.object({ ministryId: z.string().min(1), memberId: z.string().min(1) });

function revalidateMinistries(ministryId?: string) {
  revalidatePath("/ministerios");
  if (ministryId) revalidatePath(`/ministerios/${ministryId}`);
  revalidatePath("/eventos");
  revalidatePath("/inicio");
  revalidatePath("/reportes");
}

/** RF-05: crear o editar un ministerio (con `id` oculto edita). */
export async function saveMinistryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCan("ministries:write");
  const values = Object.fromEntries(FIELDS.map(key => [key, String(formData.get(key) ?? "").trim()]));
  const parsed = ministrySchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const id = String(formData.get("id") ?? "");
  if (id) await assertMinistryInScope(user, id);
  const { name, description, coordinatorId } = parsed.data;

  const duplicate = await db.ministry.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (duplicate) {
    return { error: "Revisa los campos marcados.", fieldErrors: { name: ["Ya existe un ministerio con ese nombre."] }, values };
  }
  if (coordinatorId && !(await db.member.findFirst({ where: { id: coordinatorId, active: true }, select: { id: true } }))) {
    return { error: "Revisa los campos marcados.", fieldErrors: { coordinatorId: ["El coordinador ya no está disponible."] }, values };
  }

  const data = { name, description: description || null, coordinatorId: coordinatorId || null };
  if (id) {
    const result = await db.ministry.updateMany({ where: { id }, data });
    if (!result.count) return { error: "El ministerio ya no está disponible. Actualiza la página.", values };
  } else {
    await db.ministry.create({ data });
  }

  revalidateMinistries(id || undefined);
  return { success: id ? "Ministerio actualizado." : "Ministerio creado." };
}

/**
 * Eliminar un ministerio. Los ministerios no tienen baja lógica en el esquema, así que solo se
 * permite si no tiene eventos (se conservan los eventos y su historial de asistencia).
 */
export async function deleteMinistryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCan("ministries:write");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Solicitud no válida. Actualiza la página." };
  await assertMinistryInScope(user, id);

  const events = await db.event.count({ where: { ministryId: id } });
  if (events > 0) {
    return { error: `No se puede eliminar: tiene ${events} evento(s). Desvincula o reasigna sus eventos primero.` };
  }
  const result = await db.ministry.deleteMany({ where: { id } });
  if (!result.count) return { error: "El ministerio ya no está disponible." };

  revalidateMinistries();
  return { success: "Ministerio eliminado." };
}

/** Vincular un miembro a un ministerio (único por par). */
export async function linkMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCan("ministries:write");
  const parsed = linkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Selecciona un miembro.", fieldErrors: { memberId: ["Selecciona un miembro."] } };
  }
  const { ministryId, memberId } = parsed.data;
  await assertMinistryInScope(user, ministryId);

  const [ministry, member] = await Promise.all([
    db.ministry.findUnique({ where: { id: ministryId }, select: { id: true } }),
    db.member.findFirst({ where: { id: memberId, active: true }, select: { id: true } }),
  ]);
  if (!ministry) return { error: "El ministerio ya no está disponible." };
  if (!member) return { fieldErrors: { memberId: ["El miembro ya no está disponible."] } };

  await db.ministryMember.createMany({ data: [{ ministryId, memberId }], skipDuplicates: true });

  revalidateMinistries(ministryId);
  return { success: "Miembro vinculado." };
}

/** Desvincular un miembro de un ministerio (solo borra la relación, nunca al miembro). */
export async function unlinkMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCan("ministries:write");
  const parsed = linkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Solicitud no válida. Actualiza la página." };
  const { ministryId, memberId } = parsed.data;
  await assertMinistryInScope(user, ministryId);

  await db.ministryMember.deleteMany({ where: { ministryId, memberId } });

  revalidateMinistries(ministryId);
  return { success: "Miembro desvinculado." };
}
