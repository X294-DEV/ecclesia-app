import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { attendanceScope, eventScope, ministryScope, ownMinistryIds } from "@/server/scope";
import type { CurrentUser } from "@/server/session";

// Consultas del dashboard (RF-08). Las de "general" respetan el alcance del coordinador;
// las de finanzas solo se llaman si el rol tiene dashboard:finance.

const MONTHS_BACK = 6;
const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });

/** Hoy en México como YYYY-MM-DD (la app se usa allá, aunque el servidor esté en UTC). */
function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
}

/** Últimos 6 meses (incluido el actual) como claves "YYYY-MM", del más antiguo al más reciente. */
function lastMonths() {
  const [year, month] = today().split("-").map(Number);
  return Array.from({ length: MONTHS_BACK }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (MONTHS_BACK - 1 - index), 1));
    return { key: date.toISOString().slice(0, 7), label: monthLabel.format(date).replace(".", ""), start: date };
  });
}

export type MonthPoint = { month: string; total: number };

export async function getGeneralStats(user: CurrentUser) {
  const ministryIds = await ownMinistryIds(user);
  const months = lastMonths();
  const since = months[0].start;

  const [activeMembers, ministries, presentCount, upcomingEvents, attendances] = await Promise.all([
    db.member.count({
      where: {
        active: true,
        ...(ministryIds === null ? {} : { ministries: { some: { ministryId: { in: ministryIds } } } }),
      },
    }),
    db.ministry.count({ where: await ministryScope(user) }),
    db.attendance.count({ where: { present: true, ...(await attendanceScope(user)) } }),
    db.event.findMany({
      where: { status: "ACTIVO", date: { gte: new Date(`${today()}T00:00:00.000Z`) }, ...(await eventScope(user)) },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 5,
      select: { id: true, title: true, date: true, time: true, location: true },
    }),
    db.attendance.findMany({
      where: { present: true, event: { date: { gte: since } }, ...(await attendanceScope(user)) },
      select: { event: { select: { date: true } } },
    }),
  ]);

  const counts = new Map(months.map((month) => [month.key, 0]));
  for (const attendance of attendances) {
    const key = attendance.event.date.toISOString().slice(0, 7);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return {
    activeMembers,
    ministries,
    presentCount,
    upcomingEvents,
    attendanceByMonth: months.map((month): MonthPoint => ({ month: month.label, total: counts.get(month.key) ?? 0 })),
  };
}

export async function getFinanceStats() {
  const months = lastMonths();
  const donations = await db.donation.findMany({
    where: { date: { gte: months[0].start } },
    select: { date: true, amount: true },
  });

  const sums = new Map(months.map((month) => [month.key, new Prisma.Decimal(0)]));
  for (const donation of donations) {
    const key = donation.date.toISOString().slice(0, 7);
    const current = sums.get(key);
    if (current) sums.set(key, current.plus(donation.amount));
  }

  const currentKey = months[months.length - 1].key;
  return {
    monthIncome: sums.get(currentKey) ?? new Prisma.Decimal(0),
    monthLabel: new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(
      months[months.length - 1].start,
    ),
    incomeByMonth: months.map((month): MonthPoint => ({ month: month.label, total: (sums.get(month.key) ?? new Prisma.Decimal(0)).toNumber() })),
  };
}
