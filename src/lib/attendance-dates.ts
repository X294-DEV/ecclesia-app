import { z } from "zod";

const rangeSchema = z.object({
  desde: z.union([z.literal(""), z.iso.date()]),
  hasta: z.union([z.literal(""), z.iso.date()]),
}).refine(({ desde, hasta }) => !desde || !hasta || desde <= hasta);

/** Inclusive calendar dates; the database upper bound is the next midnight UTC. */
export function attendanceDateRange(desde: string, hasta: string) {
  if (!rangeSchema.safeParse({ desde, hasta }).success) return null;
  const end = hasta ? new Date(`${hasta}T00:00:00.000Z`) : undefined;
  if (end) end.setUTCDate(end.getUTCDate() + 1);
  return {
    ...(desde ? { gte: new Date(`${desde}T00:00:00.000Z`) } : {}),
    ...(end ? { lt: end } : {}),
  };
}

/** Weeks start on Monday. Event dates are calendar dates, consistently read in UTC. */
export function attendancePeriod(date: Date, unit: "week" | "month") {
  const start = new Date(date);
  if (unit === "month") return start.toISOString().slice(0, 7);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start.toISOString().slice(0, 10);
}
