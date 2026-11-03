"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";
import { requireCan } from "@/server/session";

const announcementSchema = z.object({
  title: z.string().trim().min(2, "Escribe el título.").max(150, "Máximo 150 caracteres."),
  content: z.string().trim().min(2, "Escribe el contenido.").max(5000, "Máximo 5000 caracteres."),
  publishedAt: z.iso.date("Selecciona una fecha válida.").transform(value => new Date(`${value}T00:00:00.000Z`)),
});

function revalidateAnnouncements() {
  revalidatePath("/anuncios");
  revalidatePath("/inicio");
}

/** RF-07: crear o editar un anuncio (con `id` oculto edita). El autor es quien lo crea. */
export async function saveAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCan("announcements:write");
  const important = formData.get("important") === "on";
  const values = {
    ...Object.fromEntries(["title", "content", "publishedAt"].map(key => [key, String(formData.get(key) ?? "").trim()])),
    important: important ? "on" : "",
  };
  const parsed = announcementSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const id = String(formData.get("id") ?? "");
  if (id) {
    // Al editar se conserva el autor original.
    const result = await db.announcement.updateMany({ where: { id }, data: { ...parsed.data, important } });
    if (!result.count) return { error: "El anuncio ya no está disponible. Actualiza la página.", values };
  } else {
    await db.announcement.create({ data: { ...parsed.data, important, authorId: user.id } });
  }

  revalidateAnnouncements();
  return { success: id ? "Anuncio actualizado." : "Anuncio publicado." };
}

/** Eliminar un anuncio (aquí sí se permite borrar). */
export async function deleteAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCan("announcements:write");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Solicitud no válida. Actualiza la página." };

  const result = await db.announcement.deleteMany({ where: { id } });
  if (!result.count) return { error: "El anuncio ya no está disponible." };

  revalidateAnnouncements();
  return { success: "Anuncio eliminado." };
}
