import type { Role } from "@/lib/permissions";

export const ROLES: Role[] = ["ADMIN", "PASTOR", "SECRETARIO", "TESORERO", "COORDINADOR"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  PASTOR: "Pastor",
  SECRETARIO: "Secretario",
  TESORERO: "Tesorero",
  COORDINADOR: "Coordinador",
};

export const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
