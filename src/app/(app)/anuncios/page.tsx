import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { buttonGhostClass, cardClass, cardFeaturedClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { deleteAnnouncementAction, saveAnnouncementAction } from "@/server/announcements";
import { eventScope } from "@/server/scope";
import { requireCan } from "@/server/session";

export const metadata = { title: "Anuncios" };
type Query = { editar?: string | string[] };

const DATE_FORMAT = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" });
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" });

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
            <article key={announcement.id} className={announcement.important ? cardFeaturedClass : cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-medium">{announcement.title}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {announcement.important && (
                    <span className="rounded border border-brand px-2 py-0.5 font-semibold text-brand">Importante</span>
                  )}
                  {announcement.publishedAt >= tomorrow && (
                    <span className="rounded border border-border px-2 py-0.5 text-muted">Programado</span>
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted">
                {DATE_FORMAT.format(announcement.publishedAt)} · {announcement.author.name}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm">{announcement.content}</p>
              {writable && (
                <div className="mt-4 flex flex-wrap items-start gap-2">
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
            <h2 className="mb-4 font-medium">Próximos eventos</h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted">No hay eventos próximos.</p>
            ) : (
              <ul className="space-y-3">
                {events.map(event => (
                  <li key={event.id} className="border-l-2 border-brand pl-3 text-sm">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted">
                      {SHORT_DATE_FORMAT.format(event.date)} · {event.time} · {event.location}
                    </p>
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
