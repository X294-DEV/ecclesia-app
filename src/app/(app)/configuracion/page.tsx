import { ActionForm } from "@/components/ui/action-form";
import { DataTable } from "@/components/ui/data-table";
import { GothicDivider } from "@/components/ui/gothic";
import { PageHeader } from "@/components/ui/page-header";
import { buttonGhostClass, cardClass } from "@/components/ui/styles";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import {
  createScheduleAction,
  deleteScheduleAction,
  removeLogoAction,
  updateChurchAction,
  updateLogoAction,
  updateScheduleAction,
} from "@/server/church";
import { requireCan } from "@/server/session";
import { LogoForm } from "./logo-form";

export const metadata = { title: "Configuración de la iglesia" };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_OPTIONS = DAYS.map((label, index) => ({ value: String(index), label }));

// RF-10: datos de la iglesia (una sola fila, id = 1) y horarios habituales.
export default async function ConfiguracionPage() {
  const user = await requireCan("church:read");
  const canWrite = can(user.role, "church:write");

  const church = await db.church.findUnique({ where: { id: 1 } });
  const schedules = await db.meetingSchedule.findMany({
    where: { churchId: 1 },
    orderBy: [{ dayOfWeek: "asc" }, { time: "asc" }],
  });

  return (
    <>
      <PageHeader title="Configuración de la iglesia" description="Datos institucionales, logo y horarios habituales." />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className={cardClass}>
          <h2 className="mb-4 font-medium">Datos generales</h2>
          {canWrite ? (
            <ActionForm
              action={updateChurchAction}
              submitLabel="Guardar cambios"
              columns={2}
              fields={[
                { name: "name", label: "Nombre", required: true, defaultValue: church?.name ?? "", full: true },
                { name: "address", label: "Dirección", defaultValue: church?.address ?? "", full: true },
                { name: "phone", label: "Teléfono", defaultValue: church?.phone ?? "" },
                { name: "email", label: "Correo", type: "email", defaultValue: church?.email ?? "" },
              ]}
            />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-muted">Nombre</dt>
                <dd>{church?.name ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Dirección</dt>
                <dd>{church?.address ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Teléfono</dt>
                <dd>{church?.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Correo</dt>
                <dd>{church?.email ?? "—"}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className={`${cardClass} h-fit`}>
          <h2 className="mb-4 font-medium">Logo</h2>
          {church?.logoUrl ? (
            // Data URL guardada en la BD: next/image no aporta nada aquí.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={church.logoUrl}
              alt={`Logo de ${church.name}`}
              className="mb-4 max-h-40 w-auto rounded-md border border-border bg-background p-2"
            />
          ) : (
            <p className="mb-4 text-sm text-muted">Aún no hay logo.</p>
          )}
          {canWrite && (
            <div className="space-y-3">
              <LogoForm action={updateLogoAction} />
              {church?.logoUrl && (
                <form action={removeLogoAction}>
                  <button type="submit" className={buttonGhostClass}>
                    Quitar logo
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      </div>

      <GothicDivider className="my-8" />

      <h2 className="mb-4 font-display text-lg text-brand">Horarios habituales</h2>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DataTable
          rows={schedules}
          getKey={(schedule) => schedule.id}
          empty="Aún no hay horarios registrados."
          columns={[
            { header: "Día", cell: (schedule) => DAYS[schedule.dayOfWeek] },
            { header: "Hora", cell: (schedule) => schedule.time },
            { header: "Descripción", cell: (schedule) => schedule.description },
            ...(canWrite
              ? [
                  {
                    header: "Acciones",
                    cell: (schedule: (typeof schedules)[number]) => (
                      <div className="flex flex-col gap-2">
                        <details>
                          <summary className={`${buttonGhostClass} cursor-pointer`}>Editar</summary>
                          <div className="mt-3 min-w-64">
                            <ActionForm
                              action={updateScheduleAction}
                              submitLabel="Guardar"
                              hidden={{ id: schedule.id }}
                              fields={[
                                {
                                  name: "dayOfWeek",
                                  label: "Día",
                                  type: "select",
                                  required: true,
                                  options: DAY_OPTIONS,
                                  defaultValue: String(schedule.dayOfWeek),
                                },
                                { name: "time", label: "Hora", type: "time", required: true, defaultValue: schedule.time },
                                {
                                  name: "description",
                                  label: "Descripción",
                                  required: true,
                                  defaultValue: schedule.description,
                                },
                              ]}
                            />
                          </div>
                        </details>
                        <form action={deleteScheduleAction}>
                          <input type="hidden" name="id" value={schedule.id} />
                          <button type="submit" className={buttonGhostClass}>
                            Eliminar
                          </button>
                        </form>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />

        {canWrite && (
          <section className={`${cardClass} h-fit`}>
            <h2 className="mb-4 font-medium">Nuevo horario</h2>
            <ActionForm
              action={createScheduleAction}
              submitLabel="Agregar horario"
              fields={[
                { name: "dayOfWeek", label: "Día", type: "select", required: true, options: DAY_OPTIONS },
                { name: "time", label: "Hora", type: "time", required: true },
                { name: "description", label: "Descripción", required: true, placeholder: "Culto dominical" },
              ]}
            />
          </section>
        )}
      </div>
    </>
  );
}
