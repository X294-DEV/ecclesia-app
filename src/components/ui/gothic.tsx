// Motivos góticos en SVG en línea (sin imágenes). Los colores salen de los tokens del tema.

/** Arco ojival decorativo; se coloca sobre el título de cada página. */
export function Arch({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 28"
      className={`h-6 w-10 text-brand ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4 28V16C4 8 14 4 24 1c10 3 20 7 20 15v12" />
      <path d="M11 28V17c0-5 6-8 13-11 7 3 13 6 13 11v11" opacity="0.6" />
      <path d="M24 1v5" opacity="0.6" />
    </svg>
  );
}

/** Rosetón (rosa de vitral). Tenue: sirve de fondo en el login y de marca de agua en el menú. */
export function RoseWindow({ className = "" }: { className?: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg
      aria-hidden="true"
      viewBox="-50 -50 100 100"
      className={`text-brand ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.6"
    >
      <circle r="48" />
      <circle r="44" opacity="0.5" />
      <circle r="8" />
      <circle r="3" fill="currentColor" stroke="none" />
      {petals.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <path d="M0 -8 C-9 -18 -9 -30 0 -40 C9 -30 9 -18 0 -8Z" />
          <circle cy="-43" r="2" />
          <path d="M0 -8V-40" opacity="0.4" />
        </g>
      ))}
    </svg>
  );
}

/** Divisor ornamental (línea con flor de lis al centro) entre secciones. */
export function GothicDivider({ className = "" }: { className?: string }) {
  return (
    <div role="separator" className={`flex items-center gap-3 text-brand ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand/60" />
      <svg aria-hidden="true" viewBox="-12 -12 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M0 -11C3 -7 3 -3 0 1 -3 -3 -3 -7 0 -11Z" />
        <path d="M-1.5 2C-6 -1 -10 -1 -10 3c0 3 4 4 7 2-2 3-1 5 3 6 4-1 5-3 3-6 3 2 7 1 7-2 0-4-4-4-8-1Z" />
        <rect x="-4" y="7" width="8" height="1.6" rx="0.8" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand/60" />
    </div>
  );
}
