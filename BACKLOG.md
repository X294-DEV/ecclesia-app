# BACKLOG — Entrega 3 nov 2026

Estado: `[ ]` pendiente · `[~]` en curso / escrito y por probar · `[x]` listo
Reparto entre 4 personas: **A**, **B**, **C**, **D**. Cada quien toma módulos completos (BD + server actions + pantalla).
**Cómo empezar un módulo:** copiar el patrón de `src/app/(app)/usuarios/page.tsx` y `src/server/users.ts` (ver `AGENTS.md`). Cada módulo ya tiene una página placeholder: se reemplaza.

## Fase 0 — Base (A) — lista (PR #1)

- [x] **A** Scaffolding Next.js 16 + Tailwind, conexión a Postgres, primera migración
- [x] **A** Auth.js con credenciales, roles en sesión, `proxy.ts`, `requireCan()`
- [x] **A** `permissions.ts` integrado + layout con menú según rol
- [x] **A** Componentes genéricos: `DataTable`, `ActionForm`, `PageHeader`
- [x] **A** RF-01 completo: registrar usuarios, activar/desactivar, login/logout, recuperar contraseña, restringir por rol
- [x] **A** Seed con un usuario por rol y datos de demo

## Fase 1 — Módulos (mié 28 – sáb 31)

- [ ] **C** RF-10 Configuración de la iglesia (nombre, logo, dirección, contacto, horarios) — `src/app/(app)/configuracion`
- [x] **B** RF-02 Miembros (alta, edición, búsqueda por nombre, filtro activos/inactivos, baja lógica) — `miembros`
- [ ] **D** RF-05 Ministerios (CRUD, coordinador, vincular miembros) — `ministerios`
- [ ] **D** RF-04 Eventos (CRUD, responsable, cancelar, calendario) — `eventos`
- [x] **B** RF-03 Asistencia (elegir evento y fecha, marcar presentes/ausentes, historial) — `asistencia`
- [ ] **C** RF-06 Donaciones (captura, anónimas, consulta por periodo, resumen mensual, acceso restringido) — `donaciones`
- [ ] **D** RF-07 Anuncios (CRUD, fecha de publicación, próximos eventos y avisos importantes) — `anuncios`

## Fase 2 — Cierre (sáb 31 – lun 2 nov)

- [ ] **C** RF-08 Dashboard con gráficas (finanzas solo para roles autorizados) — `inicio`
- [x] **A** Helper de exportación Excel/PDF (`src/lib/export.ts`) + registro de reportes (`src/server/reports.ts`) + página `reportes`
- [x] **A** RF-09 Reporte general de miembros
- [ ] **B** RF-09 Reporte de asistencia por evento (agregarlo a `REPORTS`)
- [ ] **D** RF-09 Reporte de participación por ministerio (agregarlo a `REPORTS`)
- [ ] **C** RF-09 Reporte de ingresos por periodo (agregarlo a `REPORTS`, permiso `reports:finance`)
- [x] **A** Alcance del coordinador: helpers en `src/server/scope.ts` + usuario vinculado a miembro
- [x] **B** Usar `scope.ts` en asistencia (consultas y guardado)
- [ ] **D** Usar `scope.ts` en ministerios y eventos (ver `AGENTS.md`)
- [~] **A** Revisión de permisos por rol: `npm run check:permisos` (correrlo de nuevo cuando entren todos los módulos)
- [~] **A** Despliegue preparado (`docs/despliegue.md`); falta crear Neon y Vercel
- [ ] **todos** Despliegue, documentación, ensayo de la presentación

## Si hay atraso, recortar en este orden

1. Exportación a PDF (dejar solo Excel o CSV)
2. Gráficas secundarias del dashboard
3. Calendario (cambiar por lista agrupada por fecha)

## Decisiones pendientes

- [ ] ¿Los miembros tienen acceso propio al sistema? Los roles de RF-01 son solo staff, así que se asume que no; confirmar con el profesor.
- [ ] Confirmar matriz de roles (ver `src/lib/permissions.ts`).
- [x] Recuperación de contraseña: enlace por Resend si hay `RESEND_API_KEY`; si no, se muestra en pantalla y en consola (modo demo).
