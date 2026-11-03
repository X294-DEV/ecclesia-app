import Link from "next/link";

export type CalendarEvent = {
  id: string;
  title: string;
  day: number;
  time: string;
  cancelled: boolean;
  /** Enlace para editar (solo si el usuario puede escribir). */
  href?: string;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

/** Anillo de rosetón alrededor del día de hoy. */
function TodayRing() {
  return (
    <svg
      aria-hidden="true"
      viewBox="-16 -16 32 32"
      className="absolute inset-0 h-full w-full text-brand"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle r="14.5" />
      <circle r="12.5" opacity="0.5" />
      {TICKS.map((angle) => (
        <path key={angle} transform={`rotate(${angle})`} d="M0 -14.5V-16" />
      ))}
    </svg>
  );
}

/**
 * Cuadrícula mensual hecha a mano (sin librerías). Solo usa los tokens del tema,
 * así hereda el diseño. `month` es 0-11.
 */
export function MonthCalendar({ year, month, events }: { year: number; month: number; events: CalendarEvent[] }) {
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // semana empieza en lunes
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  return (
    <div className="gothic-card overflow-x-auto rounded-lg bg-surface">
      <div className="min-w-[44rem]">
        <div className="grid grid-cols-7 border-b border-brand/40 bg-brand/5 text-center font-display text-sm text-brand">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2.5">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            const dayEvents = day ? events.filter((event) => event.day === day).sort((a, b) => a.time.localeCompare(b.time)) : [];
            const weekend = index % 7 >= 5;
            return (
              <div
                key={index}
                className={`min-h-28 border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0 ${
                  day === null ? "bg-background/60" : weekend ? "bg-background/40" : ""
                }`}
              >
                {day && (
                  <>
                    {day === todayDay ? (
                      <span className="relative inline-flex h-9 w-9 items-center justify-center">
                        <TodayRing />
                        <span className="relative font-display text-sm font-bold text-brand">{day}</span>
                      </span>
                    ) : (
                      <span className="inline-flex h-9 items-center pl-1.5 font-display text-base text-muted">{day}</span>
                    )}
                    <ul className="space-y-1">
                      {dayEvents.map((event) => {
                        const label = (
                          <>
                            <span className="font-semibold">{event.time}</span> {event.title}
                          </>
                        );
                        const className = `block rounded-sm border-l-[3px] px-1.5 py-1 text-xs leading-snug ${
                          event.cancelled
                            ? "border-border text-muted line-through"
                            : "border-accent bg-parchment text-ink shadow-[0_2px_6px_-2px_rgb(0_0_0/0.7)]"
                        }`;
                        return (
                          <li key={event.id}>
                            {event.href ? (
                              <Link href={event.href} className={`${className} hover:brightness-95`}>{label}</Link>
                            ) : (
                              <span className={className}>{label}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
