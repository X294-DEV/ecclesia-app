# BACKLOG — Entrega 3 nov 2026

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` listo
Reparto sugerido entre 4 personas (ajústenlo): **A**, **B**, **C**, **D**. Cada quien toma módulos completos (BD + API + pantalla).

## Fase 0 — Base (dom 25 – mar 27) — todos dependen de esto

- [ ] **A** Scaffolding Next.js + Tailwind + shadcn/ui, conexión a Postgres, primera migración
- [ ] **A** Auth.js con credenciales, roles en sesión, middleware de rutas
- [ ] **A** `permissions.ts` integrado + layout con menú según rol
- [ ] **B** Componente genérico de tabla + formulario CRUD reutilizable
- [ ] **A** RF-01 completo: registrar usuarios, login/logout, recuperar contraseña, restringir por rol
- [ ] **C** Seed con un usuario por rol y datos de demo

## Fase 1 — Módulos (mié 28 – sáb 31)

- [ ] **C** RF-10 Configuración de la iglesia (nombre, logo, dirección, contacto, horarios)
- [ ] **B** RF-02 Miembros (alta, edición, búsqueda por nombre, filtro activos/inactivos, baja lógica)
- [ ] **D** RF-05 Ministerios (CRUD, coordinador, vincular miembros)
- [ ] **D** RF-04 Eventos (CRUD, responsable, cancelar, calendario)
- [ ] **B** RF-03 Asistencia (elegir evento y fecha, marcar presentes/ausentes, historial)
- [ ] **C** RF-06 Donaciones (captura, anónimas, consulta por periodo, resumen mensual, acceso restringido)
- [ ] **D** RF-07 Anuncios (CRUD, fecha de publicación, próximos eventos y avisos importantes)

## Fase 2 — Cierre (sáb 31 – lun 2 nov)

- [ ] **C** RF-08 Dashboard con gráficas (finanzas solo para roles autorizados)
- [ ] **B** RF-09 Reportes: miembros, asistencia por evento, participación por ministerio, ingresos por periodo
- [ ] **B** Exportación a Excel
- [ ] **D** Exportación a PDF
- [ ] **A** Revisión de permisos por rol (probar cada rol en cada módulo)
- [ ] **todos** Despliegue, documentación, ensayo de la presentación

## Si hay atraso, recortar en este orden

1. Exportación a PDF (dejar solo Excel o CSV)
2. Gráficas secundarias del dashboard
3. Calendario (cambiar por lista agrupada por fecha)

## Decisiones pendientes

- [ ] ¿Los miembros tienen acceso propio al sistema? Los roles de RF-01 son solo staff, así que se asume que no; confirmar con el profesor.
- [ ] Confirmar matriz de roles (ver `src/lib/permissions.ts`).
- [ ] Recuperación de contraseña: enlace por Resend o mostrado en pantalla/consola para la demo.
