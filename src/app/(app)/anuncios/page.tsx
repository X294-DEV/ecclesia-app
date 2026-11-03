import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Seal } from "@/components/ui/gothic";
import { PageHeader } from "@/components/ui/page-header";
import { buttonGhostClass, cardClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { deleteAnnouncementAction, saveAnnouncementAction } from "@/server/announcements";
import { eventScope } from "@/server/scope";
import { requireCan } from "@/server/session";

export const metadata = { title: "Anuncios" };
type Query = { editar?: string | string[] };

const DATE_FORMAT = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" });
const MONTH_FORMAT = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });

// RF-07: avisos de la iglesia (los importantes destacados) y los próximos eventos.
export default async function AnunciosPage({ searchParams }: { searchParams: Promise<Query> }) {
  const user = await requireCan("announcements:read");
  const query = await searchParams;
  const writable = can(user.role, "announcements:write");
  const editId = writable && typeof query.editar === "string" ? query.editar : "";

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const [announcements, events, editing] = await Promise.all([
    db.announcement.findMany({
      // Quien no puede escribir solo ve lo ya publicado; quien escribe ve también los programados.
      where: writable ? {} : { publishedAt: { lt: tomorrow } },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      include: { author: { select: { name: true } } },
    }),
    db.event.findMany({
      where: { ...(await eventScope(user)), status: "ACTIVO", date: { gte: today } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 5,
      select: { id: true, title: true, date: true, time: true, location: true },
    }),
    editId ? db.announcement.findUnique({ where: { id: editId } }) : null,
  ]);

  return (
    <>
      <PageHeader title="Anuncios" description="Avisos y comunicados de la iglesia." />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-4">
          {announcements.length === 0 && (
            <p className={`${cardClass} text-center text-muted`}>Todavía no hay anuncios publicados.</p>
          )}
          {announcements.map(announcement => (
            <article
              key={announcement.id}
              className={
                announcement.important
                  ? "relative overflow-hidden rounded-sm border border-brand shadow-[0_14px_30px_-14px_rgb(0_0_0/0.8)]"
                  : "gothic-card overflow-hidden rounded-lg bg-surface"
              }
            >
              {/* Los importantes se leen sobre pergamino y llevan un sello de cera. */}
              <div className={announcement.important ? "bg-parchment p-5 pr-20 text-ink" : "p-5"}>
                {announcement.important && <Seal className="absolute right-3 top-3 h-14 w-14 text-ink" />}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {announcement.important && (
                    <span className="rounded-full border border-ink/60 px-2.5 py-0.5 font-semibold uppercase tracking-wide">
                      Importante
                    </span>
                  )}
                  {announcement.publishedAt >= tomorrow && (
                    <span
                      className={`rounded-full border px-2.5 py-0.5 ${
                        announcement.important ? "border-ink/40 text-ink/75" : "border-border text-muted"
                      }`}
                    >
                      Programado
                    </span>
                  )}
                </div>
                <h2 className="mt-1 font-display text-xl font-bold leading-snug">{announcement.title}</h2>
                <p className={`mt-1 text-xs ${announcement.important ? "text-ink/75" : "text-muted"}`}>
                  {DATE_FORMAT.format(announcement.publishedAt)} · {announcement.author.name}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm">{announcement.content}</p>
              </div>
              {writable && (
                <div className="flex flex-wrap items-center gap-2 border-t border-brand/40 bg-surface px-5 py-3">
                  <Link className={buttonGhostClass} href={`/anuncios?editar=${announcement.id}`}>Editar</Link>
                  <ActionForm
                    action={deleteAnnouncementAction}
                    fields={[]}
                    hidden={{ id: announcement.id }}
                    submitLabel="Eliminar"
                  />
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="space-y-6">
          {writable && (
            <section className={`${cardClass} h-fit`}>
              <h2 className="mb-4 font-medium">{editing ? "Editar anuncio" : "Nuevo anuncio"}</h2>
              {editId && !editing && <p role="alert" className="mb-4 text-sm text-danger">No se encontró el anuncio solicitado.</p>}
              <ActionForm
                key={editing?.id ?? "new"}
                action={saveAnnouncementAction}
                hidden={editing ? { id: editing.id } : undefined}
                submitLabel={editing ? "Guardar cambios" : "Publicar anuncio"}
                fields={[
                  { name: "title", label: "Título", required: true, defaultValue: editing?.title },
                  { name: "content", label: "Contenido", type: "textarea", required: true, defaultValue: editing?.content },
                  {
                    name: "publishedAt",
                    label: "Fecha de publicación",
                    type: "date",
                    required: true,
                    defaultValue: (editing?.publishedAt ?? today).toISOString().slice(0, 10),
                  },
                  { name: "important", label: "Marcar como importante", type: "checkbox", defaultValue: editing?.important ?? false },
                ]}
              />
              {editing && <Link href="/anuncios" className={`${buttonGhostClass} mt-4`}>Cerrar edición</Link>}
            </section>
          )}

          <section className={`${cardClass} h-fit`}>
            <h2 className="mb-4 font-display text-lg font-bold text-brand">Próximos eventos</h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted">No hay eventos próximos.</p>
            ) : (
              <ul className="space-y-3">
                {events.map(event => (
                  <li key={event.id} className="flex items-center gap-3">
                    <div className="w-12 shrink-0 rounded-sm bg-parchment py-1 text-center text-ink">
                      <p className="font-display text-xl font-bold leading-none">{event.date.getUTCDate()}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{MONTH_FORMAT.format(event.date).replace(".", "")}</p>
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="truncate text-xs text-muted">{event.time} · {event.location}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
