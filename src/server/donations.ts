"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";
import { requireCan } from "@/server/session";

const donationSchema = z.object({
  date: z.iso.date("Selecciona una fecha válida.").transform((value) => new Date(`${value}T00:00:00.000Z`)),
  // Se queda como texto con 2 decimales y Prisma lo guarda como Decimal (nunca Float).
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, "Escribe un monto válido (máximo 2 decimales).")
    .refine((value) => Number(value) > 0, "El monto debe ser mayor a cero."),
  concept: z.string().trim().min(2, "Escribe el concepto.").max(150, "Máximo 150 caracteres."),
  method: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"], { error: "Selecciona un método." }),
  // Vacío = donación anónima.
  memberId: z.string().trim().optional().transform((value) => value || null),
});

/** RF-06: registrar una donación. `memberId` vacío es válido (anónima). */
export async function createDonationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireCan("donations:write");

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = {
    date: raw.date ?? "",
    amount: raw.amount ?? "",
    concept: raw.concept ?? "",
    method: raw.method ?? "",
    memberId: raw.memberId ?? "",
  };

  const parsed = donationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  if (parsed.data.memberId) {
    const member = await db.member.findUnique({
      where: { id: parsed.data.memberId },
      select: { active: true },
    });
    if (!member?.active) {
      return { fieldErrors: { memberId: ["Selecciona un miembro activo."] }, values };
    }
  }

  await db.donation.create({
    data: {
      date: parsed.data.date,
      amount: parsed.data.amount,
      concept: parsed.data.concept,
      method: parsed.data.method,
      memberId: parsed.data.memberId,
      createdById: user.id,
    },
  });

  revalidatePath("/donaciones");
  revalidatePath("/inicio");
  revalidatePath("/reportes");
  return { success: "Donación registrada." };
}
