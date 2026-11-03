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
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <div className="min-w-[44rem]">
        <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium text-muted">
          {WEEKDAYS.map(day => (
            <div key={day} className="px-2 py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            const dayEvents = day ? events.filter(event => event.day === day).sort((a, b) => a.time.localeCompare(b.time)) : [];
            return (
              <div key={index} className="min-h-24 border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0">
                {day && (
                  <>
                    <span
                      className={
                        day === todayDay
                          ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs text-brand-foreground"
                          : "text-xs text-muted"
                      }
                    >
                      {day}
                    </span>
                    <ul className="mt-1 space-y-1">
                      {dayEvents.map(event => {
                        const label = (
                          <>
                            <span className="text-muted">{event.time}</span> {event.title}
                          </>
                        );
                        const className = `block rounded border-l-2 border-brand bg-background px-1.5 py-0.5 text-xs leading-snug ${
                          event.cancelled ? "text-muted line-through" : ""
                        }`;
                        return (
                          <li key={event.id}>
                            {event.href ? (
                              <Link href={event.href} className={`${className} hover:bg-border`}>{label}</Link>
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
