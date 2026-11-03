"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";
import { requireCan } from "@/server/session";

const MAX_LOGO_BYTES = 500 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// Los campos opcionales vacíos se guardan como null.
const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

const churchSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre de la iglesia."),
  address: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .refine((value) => value === "" || z.email().safeParse(value).success, "Correo no válido.")
    .transform((value) => value || null),
});

const scheduleSchema = z.object({
  dayOfWeek: z.coerce.number({ error: "Selecciona un día." }).int().min(0).max(6),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa el formato HH:mm."),
  description: z.string().trim().min(2, "Escribe una descripción."),
});

/** RF-10: editar los datos generales de la iglesia (una sola fila, id = 1). */
export async function updateChurchAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCan("church:write");

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = {
    name: raw.name ?? "",
    address: raw.address ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
  };

  const parsed = churchSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  await db.church.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  revalidatePath("/", "layout");
  return { success: "Datos de la iglesia actualizados." };
}

/** Guarda el logo como data URL en Church.logoUrl (en Vercel el disco es de solo lectura). */
export async function updateLogoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCan("church:write");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { fieldErrors: { logo: ["Selecciona una imagen."] } };
  }
  if (!LOGO_TYPES.includes(file.type)) {
    return { fieldErrors: { logo: ["Solo se permiten imágenes PNG, JPG, WEBP o GIF."] } };
  }
  if (file.size >= MAX_LOGO_BYTES) {
    return { fieldErrors: { logo: ["La imagen debe pesar menos de 500 KB."] } };
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const logoUrl = `data:${file.type};base64,${base64}`;

  const church = await db.church.findUnique({ where: { id: 1 }, select: { name: true } });
  await db.church.upsert({
    where: { id: 1 },
    update: { logoUrl },
    create: { id: 1, name: church?.name ?? "Mi iglesia", logoUrl },
  });

  revalidatePath("/", "layout");
  return { success: "Logo actualizado." };
}

export async function removeLogoAction(): Promise<void> {
  await requireCan("church:write");

  await db.church.updateMany({ where: { id: 1 }, data: { logoUrl: null } });
  revalidatePath("/", "layout");
}

/** Crear un horario habitual de reunión. */
export async function createScheduleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCan("church:write");

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = {
    dayOfWeek: raw.dayOfWeek ?? "",
    time: raw.time ?? "",
    description: raw.description ?? "",
  };

  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  await db.meetingSchedule.create({ data: { churchId: 1, ...parsed.data } });

  revalidatePath("/configuracion");
  return { success: "Horario agregado." };
}

/** Editar un horario existente. */
export async function updateScheduleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCan("church:write");

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = {
    dayOfWeek: raw.dayOfWeek ?? "",
    time: raw.time ?? "",
    description: raw.description ?? "",
  };

  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const id = String(raw.id ?? "");
  const result = await db.meetingSchedule.updateMany({ where: { id }, data: parsed.data });
  if (result.count === 0) return { error: "El horario ya no existe." };

  revalidatePath("/configuracion");
  return { success: "Horario actualizado." };
}

/** Eliminar un horario (los horarios son catálogo; aquí sí se permite borrar). */
export async function deleteScheduleAction(formData: FormData): Promise<void> {
  await requireCan("church:write");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.meetingSchedule.deleteMany({ where: { id } });
  revalidatePath("/configuracion");
}
