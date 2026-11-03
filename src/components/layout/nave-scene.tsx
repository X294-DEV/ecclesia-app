import Image from "next/image";

// Fondo de las pantallas de acceso: la nave de una catedral (grabado en public/diseno/nave.webp)
// con un acercamiento muy lento, rayos de luz y motas de polvo (solo CSS).

const RAYS = [
  { left: "14%", delay: "0s", width: "4.5rem" },
  { left: "30%", delay: "3s", width: "3rem" },
];

// Posiciones fijas (no aleatorias) para que servidor y cliente pinten lo mismo.
const MOTES = [
  { left: "10%", top: "72%", delay: "0s", dur: "11s" },
  { left: "20%", top: "58%", delay: "2s", dur: "13s" },
  { left: "28%", top: "80%", delay: "4s", dur: "10s" },
  { left: "36%", top: "64%", delay: "1s", dur: "12s" },
  { left: "44%", top: "76%", delay: "6s", dur: "14s" },
  { left: "52%", top: "55%", delay: "3s", dur: "11s" },
  { left: "16%", top: "40%", delay: "5s", dur: "12s" },
  { left: "40%", top: "34%", delay: "8s", dur: "15s" },
];

export function NaveScene() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-35 lg:right-[34rem] lg:opacity-100"
    >
      {/* La imagen se desvanece hacia el panel de la derecha. */}
      <div
        className="nave-drift absolute inset-0"
        style={{
          maskImage: "linear-gradient(to right, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 60%, transparent 100%)",
        }}
      >
        <Image
          src="/diseno/nave.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover object-center"
        />
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
