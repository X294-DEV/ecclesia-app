import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClass, buttonGhostClass, cardClass, inputClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { saveMemberAction, setMemberActiveAction } from "@/server/members";
import { requireCan } from "@/server/session";

export const metadata = { title: "Miembros" };
type Query = { q?: string | string[]; estado?: string | string[]; editar?: string | string[] };

export default async function MiembrosPage({ searchParams }: { searchParams: Promise<Query> }) {
  const user = await requireCan("members:read");
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const estado = query.estado === "activo" || query.estado === "inactivo" ? query.estado : "";
  const writable = can(user.role, "members:write");
  const editId = writable && typeof query.editar === "string" ? query.editar : "";
  const members = await db.member.findMany({
    where: { ...(q ? { name: { contains: q, mode: "insensitive" } } : {}), ...(estado ? { active: estado === "activo" } : {}) },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true, email: true, phone: true, joinDate: true, active: true },
  });
  const editing = editId ? await db.member.findUnique({ where: { id: editId } }) : null;
  const filters = new URLSearchParams();
  if (q) filters.set("q", q);
  if (estado) filters.set("estado", estado);
  const listHref = `/miembros${filters.size ? `?${filters}` : ""}`;
  const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" });

  return <>
    <PageHeader title="Miembros" description="Registro, contacto y estado de los miembros de la iglesia." />
    <form action="/miembros" method="get" className={`${cardClass} mb-6 flex flex-wrap items-end gap-4`}>
      <div className="min-w-48 flex-1">
        <label htmlFor="member-search" className="mb-1 block text-sm font-medium">Buscar por nombre</label>
        <input id="member-search" name="q" defaultValue={q} className={inputClass} placeholder="Nombre del miembro" />
      </div>
      <div>
        <label htmlFor="member-status" className="mb-1 block text-sm font-medium">Estado</label>
        <select id="member-status" name="estado" defaultValue={estado} className={inputClass}>
          <option value="">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
        </select>
      </div>
      <button className={buttonClass} type="submit">Filtrar</button>
      <Link href="/miembros" className={buttonGhostClass}>Limpiar</Link>
    </form>
    <div className={writable ? "grid gap-6 xl:grid-cols-[1fr_360px]" : "grid gap-6"}>
      <div>
        <p className="mb-3 text-sm text-muted">{members.length} miembro(s) encontrado(s).</p>
        <DataTable rows={members} getKey={member => member.id} empty="No hay miembros que coincidan con los filtros." columns={[
          { header: "Nombre", cell: member => member.name },
          { header: "Teléfono", cell: member => member.phone || "—" },
          { header: "Correo", cell: member => member.email || "—" },
          { header: "Ingreso", cell: member => dateFormat.format(member.joinDate) },
          { header: "Estado", cell: member => <span className={member.active ? "text-success" : "text-muted"}>{member.active ? "Activo" : "Inactivo"}</span> },
          ...(writable ? [{ header: "Acciones", cell: (member: (typeof members)[number]) => {
            const params = new URLSearchParams(filters);
            params.set("editar", member.id);
            return <div className="flex flex-wrap items-start gap-2">
              <Link className={buttonGhostClass} href={`/miembros?${params}`}>Editar</Link>
              <ActionForm action={setMemberActiveAction} fields={[]} hidden={{ id: member.id, active: String(!member.active) }} submitLabel={member.active ? "Desactivar" : "Reactivar"} />
            </div>;
          } }] : []),
        ]} />
      </div>
      {writable && <section className={`${cardClass} h-fit`}>
        <h2 className="mb-4 font-medium">{editing ? "Editar miembro" : "Nuevo miembro"}</h2>
        {editId && !editing && <p role="alert" className="mb-4 text-sm text-danger">No se encontró el miembro solicitado.</p>}
        <ActionForm key={editing?.id ?? "new"} action={saveMemberAction} hidden={editing ? { id: editing.id } : undefined} submitLabel={editing ? "Guardar cambios" : "Registrar miembro"} fields={[
          { name: "name", label: "Nombre completo", required: true, defaultValue: editing?.name },
          { name: "phone", label: "Teléfono", autoComplete: "tel", defaultValue: editing?.phone ?? "" },
          { name: "email", label: "Correo", type: "email", defaultValue: editing?.email ?? "" },
          { name: "joinDate", label: "Fecha de ingreso", type: "date", required: true, defaultValue: editing?.joinDate.toISOString().slice(0, 10) },
        ]} />
        {editing && <Link href={listHref} className={`${buttonGhostClass} mt-4`}>Cerrar edición</Link>}
      </section>}
    </div>
  </>;
}
