// Fuente única de verdad de permisos (RF-01).
// Úsalo en el menú (para ocultar opciones) y en cada endpoint/server action (para bloquear).

export type Role = "ADMIN" | "PASTOR" | "SECRETARIO" | "TESORERO" | "COORDINADOR";

export type Action =
  | "users:manage"
  | "church:read"
  | "church:write"
  | "members:read"
  | "members:write"
  | "ministries:read"
  | "ministries:write"
  | "events:read"
  | "events:write"
  | "attendance:read"
  | "attendance:write"
  | "donations:read"
  | "donations:write"
  | "announcements:read"
  | "announcements:write"
  | "dashboard:general"
  | "dashboard:finance"
  | "reports:general"
  | "reports:finance";

export const PERMISSIONS: Record<Role, Action[]> = {
  ADMIN: [
    "users:manage",
    "church:read", "church:write",
    "members:read", "members:write",
    "ministries:read", "ministries:write",
    "events:read", "events:write",
    "attendance:read", "attendance:write",
    "donations:read", "donations:write",
    "announcements:read", "announcements:write",
    "dashboard:general", "dashboard:finance",
    "reports:general", "reports:finance",
  ],
  PASTOR: [
    "church:read", "church:write",
    "members:read",
    "ministries:read", "ministries:write",
    "events:read", "events:write",
    "attendance:read",
    "donations:read",
    "announcements:read", "announcements:write",
    "dashboard:general", "dashboard:finance",
    "reports:general", "reports:finance",
  ],
  SECRETARIO: [
    "church:read", "church:write",
    "members:read", "members:write",
    "ministries:read", "ministries:write",
    "events:read", "events:write",
    "attendance:read", "attendance:write",
    "announcements:read", "announcements:write",
    "dashboard:general",
    "reports:general",
  ],
  TESORERO: [
    "church:read",
    "donations:read", "donations:write",
    "announcements:read",
    "events:read",
    "dashboard:finance",
    "reports:finance",
  ],
  // El coordinador además queda limitado a SU ministerio (ver scopeToOwnMinistry).
  COORDINADOR: [
    "church:read",
    "members:read",
    "ministries:read",
    "events:read", "events:write",
    "attendance:read", "attendance:write",
    "announcements:read",
    "dashboard:general",
    "reports:general",
  ],
};

export function can(role: Role | undefined, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role].includes(action);
}

/** Lanza error 403 si el rol no tiene el permiso. Úsalo al inicio de cada endpoint. */
export function assertCan(role: Role | undefined, action: Action): void {
  if (!can(role, action)) {
    throw new Response("Forbidden", { status: 403 });
  }
}

/** Para coordinadores: las consultas de ministerios/eventos/asistencia se filtran a su ministerio. */
export function scopeToOwnMinistry(role: Role): boolean {
  return role === "COORDINADOR";
}
