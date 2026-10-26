import { ActionForm } from "@/components/ui/action-form";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { buttonGhostClass, cardClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { ROLE_LABELS, ROLE_OPTIONS } from "@/lib/roles";
import { createUserAction, toggleUserActiveAction } from "@/server/users";
import { requireCan } from "@/server/session";

export const metadata = { title: "Usuarios" };

// RF-01: usuarios del sistema y sus roles (solo administrador).
// Este módulo sirve de EJEMPLO del patrón: requireCan -> consulta -> DataTable + ActionForm + server actions.
export default async function UsuariosPage() {
  const currentUser = await requireCan("users:manage");

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, active: true, member: { select: { name: true } } },
  });
  const members = await db.member.findMany({
    where: { active: true, user: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader title="Usuarios" description="Cuentas con acceso al sistema y su rol." />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DataTable
          rows={users}
          getKey={(user) => user.id}
          columns={[
            { header: "Nombre", cell: (user) => user.name },
            { header: "Correo", cell: (user) => user.email },
            { header: "Rol", cell: (user) => ROLE_LABELS[user.role] },
            { header: "Miembro", cell: (user) => user.member?.name ?? <span className="text-muted">—</span> },
            {
              header: "Estado",
              cell: (user) => (
                <span className={user.active ? "text-success" : "text-muted"}>
                  {user.active ? "Activo" : "Inactivo"}
                </span>
              ),
            },
            {
              header: "Acción",
              cell: (user) =>
                user.id === currentUser.id ? (
                  <span className="text-xs text-muted">Tu cuenta</span>
                ) : (
                  <form action={toggleUserActiveAction}>
                    <input type="hidden" name="id" value={user.id} />
                    <button type="submit" className={buttonGhostClass}>
                      {user.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                ),
            },
          ]}
        />

        <section className={`${cardClass} h-fit`}>
          <h2 className="mb-4 font-medium">Nuevo usuario</h2>
          <ActionForm
            action={createUserAction}
            submitLabel="Crear usuario"
            fields={[
              { name: "name", label: "Nombre completo", required: true },
              { name: "email", label: "Correo", type: "email", required: true },
              {
                name: "password",
                label: "Contraseña inicial",
                type: "password",
                required: true,
                autoComplete: "new-password",
              },
              { name: "role", label: "Rol", type: "select", required: true, options: ROLE_OPTIONS },
              {
                name: "memberId",
                label: "Miembro vinculado (obligatorio para coordinador)",
                type: "select",
                options: members.map((member) => ({ value: member.id, label: member.name })),
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
