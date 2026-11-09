// Fondo de las pantallas de acceso: la nave de una catedral (grabado en public/diseno/nave.webp)
// con un acercamiento muy lento, rayos de luz y motas de polvo (solo CSS).
//
// La imagen ocupa todo el ancho: se repite en espejo (espejo · normal · espejo · ...) de modo que
// en cada unión las columnas coinciden y la arquitectura continúa sin corte. El rosetón queda en
// --rose-x (a la izquierda en escritorio, centrado en móvil) y el panel de acceso va encima.

import { preload } from "react-dom";

const TILE_W = 85.69; // ancho de cada tira en vh: la imagen mide 850x992, así que a 100vh de alto no se recorta
const ROSE_AT = 0.573; // posición del rosetón dentro de la imagen (487 de 850 px)
// Tiras alternadas: las de índice par van en espejo y las impares normales. El rosetón está en la
// tira normal BASE; hay tiras de sobra a ambos lados para cubrir también ventanas muy anchas.
const TILES = Array.from({ length: 9 }, (_, index) => index % 2 === 0);
const BASE = 3;
const ROW_LEFT = `calc(var(--rose-x) - ${(TILE_W * (BASE + ROSE_AT)).toFixed(1)}vh)`;

const RAYS = [
  { left: "8%", delay: "0s", width: "4.5rem" },
  { left: "18%", delay: "3s", width: "3rem" },
];

// Posiciones fijas (no aleatorias) para que servidor y cliente pinten lo mismo.
const MOTES = [
  { left: "6%", top: "72%", delay: "0s", dur: "11s" },
  { left: "12%", top: "58%", delay: "2s", dur: "13s" },
  { left: "17%", top: "80%", delay: "4s", dur: "10s" },
  { left: "22%", top: "64%", delay: "1s", dur: "12s" },
  { left: "26%", top: "76%", delay: "6s", dur: "14s" },
  { left: "31%", top: "55%", delay: "3s", dur: "11s" },
  { left: "10%", top: "40%", delay: "5s", dur: "12s" },
  { left: "24%", top: "34%", delay: "8s", dur: "15s" },
];

export function NaveScene() {
  // El fondo no es una <img>, así que se pide por adelantado para que no aparezca tarde.
  preload("/diseno/nave.webp", { as: "image" });

  // `fixed`: el fondo mide siempre exactamente la ventana (100vh). Si fuera `absolute` y la página
  // creciera más que la ventana, las tiras se recortarían por los lados y volvería el corte.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden opacity-35 [--rose-x:50vw] lg:opacity-100 lg:[--rose-x:30vw]"
    >
      <div className="nave-drift absolute inset-0">
        <div className="absolute inset-y-0 flex" style={{ left: ROW_LEFT }}>
          {TILES.map((mirror, index) => (
            <div
              key={index}
              className={`h-full shrink-0 bg-cover bg-center ${mirror ? "-scale-x-100" : ""}`}
              style={{ width: `${TILE_W}vh`, backgroundImage: "url(/diseno/nave.webp)" }}
            />
          ))}
        </div>
      </div>

      {/* Rayos de luz sobre la imagen */}
      {RAYS.map((ray) => (
        <div
          key={ray.left}
          className="light-ray absolute -top-10 h-[130%] origin-top rotate-[24deg] bg-gradient-to-b from-brand/20 to-transparent mix-blend-screen blur-[2px]"
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

      {/* Oscurece arriba y abajo para que la imagen no compita con el panel */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-background/70 to-transparent" />
    </div>
  );
}
