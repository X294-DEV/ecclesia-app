import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { buttonGhostClass, cardClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { linkMemberAction, unlinkMemberAction } from "@/server/ministries";
import { ministryScope } from "@/server/scope";
import { requireCan } from "@/server/session";

export const metadata = { title: "Detalle de ministerio" };

const DATE_FORMAT = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" });

// RF-05: detalle de un ministerio con sus integrantes y próximos eventos.
export default async function MinisterioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCan("ministries:read");
  const { id } = await params;
  const writable = can(user.role, "ministries:write");

  // El coordinador solo ve los suyos: fuera de su alcance es como si no existiera.
  const ministry = await db.ministry.findFirst({
    where: { AND: [{ id }, await ministryScope(user)] },
    include: {
      coordinator: { select: { name: true } },
      members: { orderBy: { member: { name: "asc" } }, include: { member: { select: { id: true, name: true, phone: true, active: true } } } },
    },
  });
  if (!ministry) notFound();

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const events = await db.event.findMany({
    where: { ministryId: ministry.id, status: "ACTIVO", date: { gte: today } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 10,
    include: { responsible: { select: { name: true } } },
  });

  const linkedIds = new Set(ministry.members.map(link => link.memberId));
  const available = writable
    ? await db.member.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];

  return (
    <>
      <PageHeader title={ministry.name} description={ministry.description ?? "Sin descripción."}>
        <Link href="/ministerios" className={buttonGhostClass}>← Ministerios</Link>
      </PageHeader>
      <p className="-mt-3 mb-6 text-sm text-muted">
        Coordinador: <span className="text-foreground">{ministry.coordinator?.name ?? "Sin asignar"}</span>
      </p>

      <div className={writable ? "grid gap-6 xl:grid-cols-[1fr_360px]" : "grid gap-6"}>
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="mb-3 font-medium">Integrantes ({ministry.members.length})</h2>
            <DataTable
              rows={ministry.members}
              getKey={link => link.id}
              empty="Este ministerio todavía no tiene integrantes."
              columns={[
                { header: "Nombre", cell: link => link.member.name },
                { header: "Teléfono", cell: link => link.member.phone || "—" },
                {
                  header: "Estado",
                  cell: link => (
                    <span className={link.member.active ? "text-success" : "text-muted"}>
                      {link.member.active ? "Activo" : "Inactivo"}
                    </span>
                  ),
                },
                ...(writable
                  ? [
                      {
                        header: "Acciones",
                        cell: (link: (typeof ministry.members)[number]) => (
                          <ActionForm
                            action={unlinkMemberAction}
                            fields={[]}
                            hidden={{ ministryId: ministry.id, memberId: link.memberId }}
                            submitLabel="Desvincular"
                          />
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </section>

          <section>
            <h2 className="mb-3 font-medium">Próximos eventos</h2>
            <DataTable
              rows={events}
              getKey={event => event.id}
              empty="No hay eventos próximos para este ministerio."
              columns={[
                { header: "Fecha", cell: event => `${DATE_FORMAT.format(event.date)} · ${event.time}` },
                { header: "Evento", cell: event => event.title },
                { header: "Lugar", cell: event => event.location },
                { header: "Responsable", cell: event => event.responsible?.name ?? <span className="text-muted">—</span> },
              ]}
            />
          </section>
        </div>

        {writable && (
          <section className={`${cardClass} h-fit`}>
            <h2 className="mb-4 font-medium">Vincular miembro</h2>
            <ActionForm
              action={linkMemberAction}
              hidden={{ ministryId: ministry.id }}
              submitLabel="Vincular"
              fields={[
                {
                  name: "memberId",
                  label: "Miembro",
                  type: "select",
                  required: true,
                  options: available
                    .filter(member => !linkedIds.has(member.id))
                    .map(member => ({ value: member.id, label: member.name })),
                },
              ]}
            />
          </section>
        )}
      </div>
    </>
  );
}
