"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

// En la BD solo se guarda el hash del token; el token en claro viaja únicamente en el enlace.
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function sendResetEmail(to: string, link: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "Ecclesia <onboarding@resend.dev>",
        to,
        subject: "Restablece tu contraseña de Ecclesia",
        html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p>
               <p><a href="${link}">Crear una contraseña nueva</a></p>
               <p>El enlace vence en 1 hora. Si no fuiste tú, ignora este mensaje.</p>`,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function requestResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawEmail = String(formData.get("email") ?? "").trim();
  const parsed = z.email().safeParse(rawEmail);
  if (!parsed.success) {
    return { error: "Escribe un correo válido.", values: { email: rawEmail } };
  }

  // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
  const generic = "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.";

  const user = await db.user.findUnique({ where: { email: parsed.data.toLowerCase() } });
  if (!user || !user.active) return { success: generic };

  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/restablecer/${token}`;

  const sent = await sendResetEmail(user.email, link);
  if (!sent) {
    // Modo demostración: sin correo configurado se muestra el enlace en pantalla y en consola.
    console.log(`[Ecclesia] Enlace de recuperación para ${user.email}: ${link}`);
    return { success: generic, devLink: link };
  }

  return { success: generic };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "El enlace no es válido o ya venció. Solicita uno nuevo." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  redirect("/login?reset=1");
}
