const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

/** Formatea dinero en pesos. Acepta Decimal de Prisma, string o number. */
export function formatMoney(value: { toString(): string } | number | string): string {
  return mxn.format(Number(value.toString()));
}
