import type { ReactNode } from "react";

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

/** Trazos del rosetón (radio 48) sin <svg>, para reutilizarlos dentro de otras escenas. */
export function RoseWindowPaths() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  const center = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <>
      <circle r="48" />
      <circle r="45.5" opacity="0.5" />
      <circle r="44" opacity="0.3" />
      {petals.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          {/* Pétalo ojival con "vidrio" tenue; alternan para dar ritmo. */}
          <path
            d="M0 -9 C-10 -19 -10 -31 0 -41 C10 -31 10 -19 0 -9Z"
            fill="currentColor"
            fillOpacity={angle % 60 === 0 ? 0.1 : 0.04}
          />
          <path d="M0 -14 C-5 -20 -5 -28 0 -35 C5 -28 5 -20 0 -14Z" opacity="0.7" />
          <path d="M0 -9V-41" opacity="0.3" />
          <circle cy="-43" r="1.6" />
        </g>
      ))}
      <circle r="9" />
      <circle r="6" opacity="0.6" />
      {center.map((angle) => (
        <path key={angle} transform={`rotate(${angle})`} d="M0 -2 C-1.8 -3.5 -1.8 -5 0 -6 C1.8 -5 1.8 -3.5 0 -2Z" opacity="0.8" />
      ))}
      <circle r="1.4" fill="currentColor" stroke="none" />
    </>
  );
}

/** Rosetón (rosa de vitral). Tenue: sirve de fondo en el login y de marca de agua en el menú. */
export function RoseWindow({ className = "", spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="-50 -50 100 100"
      className={`text-brand ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.6"
    >
      <g className={spin ? "rose-spin" : undefined}>
        <RoseWindowPaths />
      </g>
    </svg>
  );
}

/** Divisor ornamental (línea con un rosetón pequeño al centro) entre secciones. */
export function GothicDivider({ className = "" }: { className?: string }) {
  return (
    <div role="separator" className={`flex items-center gap-3 text-brand ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand/60" />
      <svg aria-hidden="true" viewBox="-12 -12 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <g transform="scale(0.24)" strokeWidth="2.6">
          <RoseWindowPaths />
        </g>
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand/60" />
    </div>
  );
}

/** Esquinas de tracería (arco con cuadrifolio) para las tarjetas de datos. Va dentro de un contenedor `relative`. */
export function TraceryCorners({ className = "" }: { className?: string }) {
  const corner = (
    <svg aria-hidden="true" viewBox="0 0 56 36" className="h-9 w-14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M1 35V10Q1 1 10 1H26" opacity="0.8" />
      <path d="M1 1C4 20 20 30 50 30" opacity="0.5" />
      <g transform="translate(15 14)">
        <circle cy="-3" r="2.4" />
        <circle cx="3" r="2.4" />
        <circle cy="3" r="2.4" />
        <circle cx="-3" r="2.4" />
      </g>
    </svg>
  );
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-1.5 top-1.5 flex justify-between text-brand ${className}`}
    >
      {corner}
      <span className="-scale-x-100">{corner}</span>
    </span>
  );
}

/**
 * Corona de arco ojival con doble línea. Se coloca en la parte alta de un panel o tarjeta;
 * `draw` hace que el trazo se dibuje al cargar. Con `fill`, el interior toma el color de la superficie.
 */
export function OgiveCrown({ className = "", draw = false }: { className?: string; draw?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 24"
      className={`block w-full text-brand ${draw ? "arch-draw" : ""} ${className}`}
      fill="none"
      stroke="currentColor"
    >
      <path className="fill-surface/90" stroke="none" d="M0 24V11C0 6 28 3 50 0C72 3 100 6 100 11V24Z" />
      <path pathLength="1" strokeWidth="0.35" d="M0 24V11C0 6 28 3 50 0C72 3 100 6 100 11V24" />
      <path pathLength="1" strokeWidth="0.25" opacity="0.5" d="M1.8 24V12C1.8 7.5 29 4.8 50 2.2C71 4.8 98.2 7.5 98.2 12V24" />
    </svg>
  );
}

/** Panel con corona ojival (pantallas de acceso). El cuerpo lleva borde doble como las tarjetas. */
export function OgivePanel({
  children,
  className = "",
  bodyClassName = "px-6 pb-6 pt-1",
  emblem,
  draw = true,
}: {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Motivo centrado dentro de la corona (por ejemplo un rosetón pequeño). */
  emblem?: ReactNode;
  draw?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <OgiveCrown draw={draw} />
      {emblem && <div className="absolute inset-x-0 top-0 flex justify-center pt-[5%]">{emblem}</div>}
      <div
        className={`relative -mt-px border-x border-b border-brand bg-surface/90 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.8)] backdrop-blur-sm ${bodyClassName}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[7px] bottom-[7px] top-0 border-x border-b border-brand/40"
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
