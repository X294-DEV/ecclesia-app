// Clases reutilizables para mantener un estilo consistente en todos los módulos.
// Tema gótico: usa estas clases y los componentes de src/components/ui; no escribas colores a mano.

export const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60";

export const buttonClass =
  "gothic-glow inline-flex items-center justify-center rounded-md border border-brand bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:brightness-110 disabled:opacity-60";

export const buttonGhostClass =
  "gothic-glow inline-flex items-center justify-center rounded-md border border-brand/70 bg-transparent px-3 py-1.5 text-sm text-brand hover:bg-brand/10 hover:border-brand";

export const cardClass = "gothic-card rounded-lg bg-surface p-5";

/** Tarjeta destacada: igual que cardClass más esquinas ornamentadas. */
export const cardFeaturedClass = `${cardClass} gothic-corners`;
