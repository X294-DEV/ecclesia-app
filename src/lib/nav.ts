import type { Action } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  /** El ítem se muestra si el rol tiene AL MENOS UNO de estos permisos. Sin valor = todos los roles. */
  anyOf?: Action[];
};

// Para agregar un módulo al menú: añade una línea aquí (y su carpeta en src/app/(app)/).
export const NAV_ITEMS: NavItem[] = [
  { href: "/inicio", label: "Inicio", description: "Resumen general" },
  { href: "/miembros", label: "Miembros", description: "RF-02 · Registro de miembros", anyOf: ["members:read"] },
  { href: "/ministerios", label: "Ministerios", description: "RF-05 · Grupos de trabajo", anyOf: ["ministries:read"] },
  { href: "/eventos", label: "Eventos", description: "RF-04 · Calendario de eventos", anyOf: ["events:read"] },
  { href: "/asistencia", label: "Asistencia", description: "RF-03 · Control de asistencia", anyOf: ["attendance:read"] },
  { href: "/donaciones", label: "Donaciones", description: "RF-06 · Aportaciones", anyOf: ["donations:read"] },
  { href: "/anuncios", label: "Anuncios", description: "RF-07 · Comunicados", anyOf: ["announcements:read"] },
  { href: "/reportes", label: "Reportes", description: "RF-09 · Reportes y exportación", anyOf: ["reports:general", "reports:finance"] },
  { href: "/configuracion", label: "Iglesia", description: "RF-10 · Datos de la iglesia", anyOf: ["church:read"] },
  { href: "/usuarios", label: "Usuarios", description: "RF-01 · Usuarios y roles", anyOf: ["users:manage"] },
];
