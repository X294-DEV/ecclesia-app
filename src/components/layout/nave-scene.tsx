import { RoseWindowPaths } from "@/components/ui/gothic";

// Fondo de las pantallas de acceso: la nave de una catedral dibujada en SVG con los colores del tema.
// Rosetón que gira lento, ventanales ojivales, rayos de luz y motas de polvo (solo CSS, sin imágenes).

const LANCETS = [330, 500, 670];

const RAYS = [
  { left: "6%", delay: "0s", width: "5.5rem" },
  { left: "20%", delay: "2.5s", width: "3.5rem" },
  { left: "33%", delay: "5s", width: "7rem" },
];

// Posiciones fijas (no aleatorias) para que servidor y cliente pinten lo mismo.
const MOTES = [
  { left: "8%", top: "72%", delay: "0s", dur: "11s" },
  { left: "15%", top: "58%", delay: "2s", dur: "13s" },
  { left: "22%", top: "80%", delay: "4s", dur: "10s" },
  { left: "29%", top: "64%", delay: "1s", dur: "12s" },
  { left: "36%", top: "76%", delay: "6s", dur: "14s" },
  { left: "43%", top: "55%", delay: "3s", dur: "11s" },
  { left: "50%", top: "82%", delay: "7s", dur: "13s" },
  { left: "12%", top: "40%", delay: "5s", dur: "12s" },
  { left: "26%", top: "34%", delay: "8s", dur: "15s" },
  { left: "40%", top: "44%", delay: "9s", dur: "11s" },
];

export function NaveScene() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-40 lg:right-[34rem] lg:opacity-100"
    >
      <svg
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full text-brand"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        {/* Arco mayor y nervaduras de la bóveda */}
        <g opacity="0.3">
          <path d="M120 700V330C120 170 330 80 500 10C670 80 880 170 880 330V700" />
          <path d="M70 700V300C70 140 310 30 500 -30" opacity="0.6" />
          <path d="M930 700V300C930 140 690 30 500 -30" opacity="0.6" />
          <path d="M120 330C250 250 400 130 500 10M880 330C750 250 600 130 500 10" opacity="0.5" />
        </g>

        {/* Columnas laterales */}
        <g opacity="0.3">
          {[40, 916].map((x) => (
            <g key={x}>
              <rect x={x} y="260" width="44" height="440" />
              <path d={`M${x + 11} 260V700M${x + 22} 260V700M${x + 33} 260V700`} opacity="0.5" />
              <path d={`M${x - 8} 260h60l-8 -14h-44z`} />
            </g>
          ))}
        </g>

        {/* Rosetón que gira despacio */}
        <g transform="translate(500 248) scale(4.4)" opacity="0.6" strokeWidth="0.3">
          <g className="rose-spin">
            <RoseWindowPaths />
          </g>
        </g>

        {/* Ventanales ojivales bajo el rosetón */}
        <g opacity="0.45">
          {LANCETS.map((cx) => (
            <g key={cx}>
              <path
                className="fill-brand/5"
                d={`M${cx - 48} 700V560C${cx - 48} 510 ${cx - 20} 490 ${cx} 470C${cx + 20} 490 ${cx + 48} 510 ${cx + 48} 560V700`}
              />
              <path d={`M${cx - 38} 700V565C${cx - 38} 525 ${cx - 16} 505 ${cx} 487C${cx + 16} 505 ${cx + 38} 525 ${cx + 38} 565V700`} opacity="0.5" />
              <path d={`M${cx} 487V700`} opacity="0.5" />
              <path d={`M${cx - 38} 600Q${cx} 570 ${cx + 38} 600`} opacity="0.5" />
            </g>
          ))}
        </g>
      </svg>

      {/* Rayos de luz que entran por el rosetón */}
      {RAYS.map((ray) => (
        <div
          key={ray.left}
          className="light-ray absolute -top-10 h-[130%] origin-top rotate-[24deg] bg-gradient-to-b from-brand/25 to-transparent mix-blend-screen blur-[2px]"
          style={{ left: ray.left, width: ray.width, animationDelay: ray.delay }}
        />
      ))}

      {/* Motas de polvo en la luz */}
      {MOTES.map((mote, index) => (
        <span
          key={index}
          className="mote absolute h-1 w-1 rounded-full bg-brand/70"
          style={{ left: mote.left, top: mote.top, animationDelay: mote.delay, animationDuration: mote.dur }}
        />
      ))}

      {/* Se funde con el fondo por abajo para no competir con el panel */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
