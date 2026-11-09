import Image from "next/image";

// Fondo de las pantallas de acceso: una sola imagen panorámica de la nave de una catedral
// (public/diseno/nave-ancha.webp, 16:9). El rosetón y la luz quedan a la izquierda y la nave sigue
// hacia la derecha, más oscura, donde va el panel de acceso. Lleva un acercamiento muy lento y
// motas de polvo (solo CSS); los rayos de luz ya vienen dibujados en la imagen.

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
  // `fixed`: el fondo mide siempre la ventana, aunque la página sea más alta que ella.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden opacity-35 lg:landscape:opacity-100"
    >
      <div className="nave-drift absolute inset-0">
        <Image
          src="/diseno/nave-ancha.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          // En pantallas anchas y horizontales se ve la imagen completa; en estrechas o verticales se
          // conserva el lado del rosetón, tenue, para que el panel no quede sobre la parte más clara.
          className="object-cover object-[25%_center] lg:landscape:object-left"
        />
      </div>

      {/* Motas de polvo en la luz */}
      {MOTES.map((mote, index) => (
        <span
          key={index}
          className="mote absolute h-1 w-1 rounded-full bg-brand/70"
          style={{ left: mote.left, top: mote.top, animationDelay: mote.delay, animationDuration: mote.dur }}
        />
      ))}

      {/* Oscurece un poco arriba y abajo para que la imagen no compita con el panel */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background/80 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/6 bg-gradient-to-b from-background/50 to-transparent" />
    </div>
  );
}
