import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { buttonGhostClass, cardClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { deleteMinistryAction, saveMinistryAction } from "@/server/ministries";
import { ministryScope } from "@/server/scope";
import { requireCan } from "@/server/session";

export const metadata = { title: "Ministerios" };
type Query = { editar?: string | string[] };

// RF-05: ministerios, su coordinador y sus integrantes.
export default async function MinisteriosPage({ searchParams }: { searchParams: Promise<Query> }) {
  const user = await requireCan("ministries:read");
  const query = await searchParams;
  const writable = can(user.role, "ministries:write");
  const editId = writable && typeof query.editar === "string" ? query.editar : "";

  const scope = await ministryScope(user);
  const ministries = await db.ministry.findMany({
    where: scope,
    orderBy: { name: "asc" },
    include: { coordinator: { select: { name: true } }, _count: { select: { members: true, events: true } } },
  });
  const [members, editing] = writable
    ? await Promise.all([
        db.member.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
        editId ? db.ministry.findFirst({ where: { AND: [{ id: editId }, scope] } }) : null,
      ])
    : [[], null];

  return (
    <>
      <PageHeader
        title="Ministerios"
        description={writable ? "Áreas de servicio de la iglesia, su coordinador e integrantes." : "Los ministerios que coordinas."}
      />

      <div className={writable ? "grid gap-6 xl:grid-cols-[1fr_360px]" : "grid gap-6"}>
        <DataTable
          rows={ministries}
          getKey={ministry => ministry.id}
          empty={writable ? "Todavía no hay ministerios registrados." : "No coordinas ningún ministerio."}
          columns={[
            {
              header: "Ministerio",
              cell: ministry => (
                <div>
                  <Link href={`/ministerios/${ministry.id}`} className="font-medium text-brand hover:underline">
                    {ministry.name}
                  </Link>
                  {ministry.description && <p className="text-xs text-muted">{ministry.description}</p>}
                </div>
              ),
            },
            { header: "Coordinador", cell: ministry => ministry.coordinator?.name ?? <span className="text-muted">—</span> },
            { header: "Integrantes", cell: ministry => ministry._count.members },
            { header: "Eventos", cell: ministry => ministry._count.events },
            {
              header: "Acciones",
              cell: ministry => (
                <div className="flex flex-wrap items-start gap-2">
                  <Link className={buttonGhostClass} href={`/ministerios/${ministry.id}`}>Ver detalle</Link>
                  {writable && (
                    <>
                      <Link className={buttonGhostClass} href={`/ministerios?editar=${ministry.id}`}>Editar</Link>
                      <ActionForm action={deleteMinistryAction} fields={[]} hidden={{ id: ministry.id }} submitLabel="Eliminar" />
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />

        {writable && (
          <section className={`${cardClass} h-fit`}>
            <h2 className="mb-4 font-medium">{editing ? "Editar ministerio" : "Nuevo ministerio"}</h2>
            {editId && !editing && <p role="alert" className="mb-4 text-sm text-danger">No se encontró el ministerio solicitado.</p>}
            <ActionForm
              key={editing?.id ?? "new"}
              action={saveMinistryAction}
              hidden={editing ? { id: editing.id } : undefined}
              submitLabel={editing ? "Guardar cambios" : "Crear ministerio"}
              fields={[
                { name: "name", label: "Nombre", required: true, defaultValue: editing?.name },
                { name: "description", label: "Descripción", type: "textarea", defaultValue: editing?.description ?? "" },
                {
                  name: "coordinatorId",
                  label: "Coordinador",
                  type: "select",
                  defaultValue: editing?.coordinatorId ?? "",
                  options: members.map(member => ({ value: member.id, label: member.name })),
                },
              ]}
            />
            {editing && <Link href="/ministerios" className={`${buttonGhostClass} mt-4`}>Cerrar edición</Link>}
          </section>
        )}
      </div>
    </>
  );
}
