"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { month: string; total: number };

// Los colores salen de los tokens del tema (var(--...)), nunca a mano.
const AXIS = { fill: "var(--muted)", fontSize: 12 };

/** Gráfica de barras por mes. `money` formatea valores y eje como pesos MXN. */
export function MonthlyBarChart({
  data,
  label,
  money = false,
  color = "var(--brand)",
}: {
  data: Point[];
  label: string;
  money?: boolean;
  color?: string;
}) {
  const format = (value: number) =>
    money
      ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value)
      : String(value);

  return (
    <div className="h-64 w-full" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={AXIS} stroke="var(--border)" />
          <YAxis tick={AXIS} stroke="var(--border)" width={money ? 72 : 36} allowDecimals={false} tickFormatter={format} />
          <Tooltip
            cursor={{ fill: "var(--glow)", opacity: 0.25 }}
            formatter={(value) => [format(Number(value)), label]}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--brand)",
              borderRadius: 6,
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--brand)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          {/* Contorno dorado: el burdeos solo no contrasta lo suficiente sobre la superficie oscura. */}
          <Bar dataKey="total" fill={color} stroke="var(--brand)" strokeWidth={1} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
