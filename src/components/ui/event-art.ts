// Ilustraciones de grabado para las tarjetas de evento (public/diseno). Solo hay tres, así que se
// elige por palabras del título y, si esa ya se usó en otra tarjeta, se toma la primera libre.

const ART = {
  coro: "/diseno/evento-coro.webp",
  solidario: "/diseno/evento-solidario.webp",
  oracion: "/diseno/evento-oracion.webp",
} as const;

const ORDER: string[] = [ART.coro, ART.solidario, ART.oracion];

const RULES: [RegExp, string][] = [
  [/alabanza|coro|m[uú]sica|ensayo|concierto|canto/i, ART.coro],
  [/solidar|colecta|v[ií]veres|servicio|ayuda|comunidad|jornada|despensa|reparto/i, ART.solidario],
  [/oraci[oó]n|culto|vigilia|b[ií]blic|estudio|retiro|reflexi[oó]n/i, ART.oracion],
];

/** Una ilustración por título, sin repetir mientras queden libres. */
export function assignEventArt(titles: string[]): string[] {
  const used = new Set<string>();
  return titles.map((title, index) => {
    const preferred = RULES.find(([pattern]) => pattern.test(title))?.[1];
    const art =
      (preferred && !used.has(preferred) ? preferred : undefined) ??
      ORDER.find((candidate) => !used.has(candidate)) ??
      ORDER[index % ORDER.length];
    used.add(art);
    return art;
  });
}
