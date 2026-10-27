"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";
import { requireCan } from "@/server/session";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre completo."),
  email: z.email("Correo no válido.").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Mínimo 8 caracteres."),
  role: z.enum(["ADMIN", "PASTOR", "SECRETARIO", "TESORERO", "COORDINADOR"], {
    error: "Selecciona un rol.",
  }),
  // Miembro vinculado (opcional; obligatorio para coordinadores, ver src/server/scope.ts).
  memberId: z.string().optional().transform((value) => value || undefined),
}).refine((data) => data.role !== "COORDINADOR" || data.memberId, {
  path: ["memberId"],
  message: "El coordinador debe estar vinculado a un miembro.",
});

/** RF-01: registrar usuarios del sistema (solo administrador). */
export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCan("users:manage");

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = {
    name: raw.name ?? "",
    email: raw.email ?? "",
    role: raw.role ?? "",
    memberId: raw.memberId ?? "",
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return { fieldErrors: { email: ["Ya existe un usuario con ese correo."] }, values };
  }
  if (parsed.data.memberId) {
    const linked = await db.user.findUnique({ where: { memberId: parsed.data.memberId } });
    if (linked) {
      return { fieldErrors: { memberId: ["Ese miembro ya tiene un usuario."] }, values };
    }
  }

  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      memberId: parsed.data.memberId,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });

  revalidatePath("/usuarios");
  return { success: `Usuario ${parsed.data.email} creado.` };
}

/** Activar o desactivar un usuario (baja lógica, nunca se elimina). */
export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const admin = await requireCan("users:manage");

  const id = String(formData.get("id") ?? "");
  if (!id || id === admin.id) return; // nadie se desactiva a sí mismo

  const user = await db.user.findUnique({
    where: { id },
    select: { active: true, role: true },
  });
  if (!user) return;

  // Nunca dejar el sistema sin un administrador activo.
  if (user.active && user.role === "ADMIN") {
    const activeAdmins = await db.user.count({ where: { role: "ADMIN", active: true } });
    if (activeAdmins <= 1) return;
  }

  await db.user.update({ where: { id }, data: { active: !user.active } });
  revalidatePath("/usuarios");
}
