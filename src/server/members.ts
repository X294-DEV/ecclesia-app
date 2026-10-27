"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";
import { requireCan } from "@/server/session";

const memberSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre completo.").max(150, "Máximo 150 caracteres."),
  phone: z.string().trim().max(30, "Máximo 30 caracteres."),
  email: z.union([z.literal(""), z.email("Correo no válido.")]).transform(value => value.toLowerCase()),
  joinDate: z.iso.date("Selecciona una fecha válida.").transform(value => new Date(`${value}T00:00:00.000Z`)),
});

export async function saveMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCan("members:write");
  const values = Object.fromEntries(["name", "phone", "email", "joinDate"].map(key => [key, String(formData.get(key) ?? "").trim()]));
  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) return { error: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  const id = String(formData.get("id") ?? "");
  const data = { ...parsed.data, phone: parsed.data.phone || null, email: parsed.data.email || null };
  if (id) {
    const result = await db.member.updateMany({ where: { id }, data });
    if (!result.count) return { error: "El miembro ya no está disponible. Actualiza la página.", values };
  } else {
    await db.member.create({ data });
  }
  revalidatePath("/miembros");
  revalidatePath("/usuarios");
  revalidatePath("/reportes");
  return { success: id ? "Miembro actualizado." : "Miembro registrado." };
}

export async function setMemberActiveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCan("members:write");
  const parsed = z.object({ id: z.string().min(1), active: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Solicitud no válida. Actualiza la página." };
  const result = await db.member.updateMany({ where: { id: parsed.data.id }, data: { active: parsed.data.active === "true" } });
  if (!result.count) return { error: "El miembro ya no está disponible." };
  revalidatePath("/miembros");
  revalidatePath("/usuarios");
  revalidatePath("/reportes");
  return { success: parsed.data.active === "true" ? "Miembro reactivado." : "Miembro desactivado." };
}
