import type { Prisma } from "@prisma/client";
import { z } from "zod";

/** Devuelve la fecha solo si es un YYYY-MM-DD válido; cualquier otra cosa se ignora. */
export function parseIsoDate(value: string | string[] | null | undefined): string {
  const parsed = z.iso.date().safeParse(typeof value === "string" ? value : "");
  return parsed.success ? parsed.data : "";
}

/**
 * Filtro de fecha para un periodo ?desde=&hasta=. El día "hasta" se incluye completo
 * (hasta antes de la medianoche UTC del día siguiente), porque una donación puede traer hora.
 */
export function periodWhere(desde: string, hasta: string): Prisma.DonationWhereInput {
  if (!desde && !hasta) return {};
  const dayAfterHasta = hasta ? new Date(new Date(`${hasta}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000) : null;
  return {
    date: {
      ...(desde ? { gte: new Date(`${desde}T00:00:00.000Z`) } : {}),
      ...(dayAfterHasta ? { lt: dayAfterHasta } : {}),
    },
  };
}
