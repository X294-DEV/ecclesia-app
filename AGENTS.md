<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Ecclesia (sistema de gestión para iglesias)

Proyecto escolar (materia de aplicaciones web). Entrega: **3 de noviembre de 2026**.
Objetivo: cubrir los requerimientos funcionales RF-01 a RF-10 con algo que funcione y se pueda demostrar. No sobreingenierizar.

## Stack

- **Next.js 16** (App Router) + TypeScript + React 19
- PostgreSQL + **Prisma 6** (esquema en `prisma/schema.prisma`)
- **Auth.js v5** (`next-auth@beta`), credenciales correo + contraseña, sesión JWT, hash con bcryptjs
- Tailwind v4 (sin shadcn por ahora; clases reutilizables en `src/components/ui/styles.ts`)
- Validación: **Zod 4** (`z.email()`, `z.flattenError()`)
- Exportación: exceljs + jsPDF/jspdf-autotable, envueltos en `src/lib/export.ts` (no usarlos directo)
- Por agregar según el módulo: FullCalendar (eventos), Recharts (dashboard)

## Particularidades de Next.js 16 (importante)

- **`middleware` ahora se llama `proxy`**: archivo `src/proxy.ts`. Solo hace una comprobación optimista de la cookie; NO es la seguridad real.
- **`cacheComponents` está desactivado** a propósito en `next.config.ts` (create-next-app lo activa). No lo reactiven: obliga a envolver todo acceso a sesión o BD en `<Suspense>`.
- **`params` y `searchParams` son Promesas**: `const { id } = await params`.
- En caso de duda, leer la guía en `node_modules/next/dist/docs/01-app/` antes de inventar APIs.

## Estructura

```
src/
  auth.ts                   # configuración de Auth.js (login con credenciales)
  proxy.ts                  # redirección optimista al login
  lib/
    permissions.ts          # ÚNICA fuente de permisos por rol  (can, assertCan)
    nav.ts                  # menú: un ítem por módulo, filtrado por permisos
    roles.ts                # etiquetas y opciones de roles
    db.ts                   # cliente Prisma (singleton)
    action-state.ts         # tipo de respuesta de las server actions
  server/
    session.ts              # getCurrentUser, requireUser, requireCan, requireAnyCan
    scope.ts                # alcance del coordinador (ministryScope, eventScope, attendanceScope)
    reports.ts              # registro de reportes exportables (RF-09)
    users.ts                # EJEMPLO de server actions (RF-01)
    auth-actions.ts, password-actions.ts
  components/
    ui/                     # DataTable, ActionForm, PageHeader, styles
    layout/                 # NavLinks, AuthShell
  app/
    login, recuperar, restablecer/[token]    # públicas
    (app)/                  # zona autenticada (layout con menú por rol)
      inicio, usuarios (ejemplo completo)
      miembros, ministerios, eventos, asistencia, donaciones,
      anuncios, configuracion, reportes      # PLACEHOLDERS: cada dueño reemplaza el suyo
prisma/
  schema.prisma, seed.ts
```

## Patrón de un módulo (copiar de `usuarios`)

1. **Página** (`src/app/(app)/<modulo>/page.tsx`): empieza con `await requireCan("<accion>")`, consulta con `db`, pinta con `<PageHeader>`, `<DataTable>` y `<ActionForm>`.
2. **Server actions** (`src/server/<modulo>.ts`, con `"use server"`): empiezan con `await requireCan("<accion de escritura>")`, validan con Zod, escriben con Prisma, llaman `revalidatePath(...)` y devuelven un `ActionState` (`{ error, fieldErrors, values }` o `{ success }`).
3. **Formularios**: `<ActionForm action={miAccion} fields={[...]} submitLabel="Guardar" />`. Los campos se definen con una lista (text, email, password, number, date, time, textarea, select, checkbox).
4. **Tablas**: `<DataTable rows={...} getKey={...} columns={[{ header, cell }]} />`.
5. El menú ya incluye tu módulo (`src/lib/nav.ts`) y se oculta solo si el rol no tiene permiso.
6. **Reporte (RF-09)**: escribe una función que devuelva un `ExportTable` y regístrala en `REPORTS` (`src/server/reports.ts`) con su permiso. La página `/reportes` la lista y `/reportes/exportar/<clave>?formato=xlsx|pdf` la descarga. Ejemplo: `miembros`.

## Convenciones

- Idioma de la UI y mensajes: **español**. Código, nombres de variables y commits en inglés.
- **Permisos:** toda página y server action empieza con `requireCan(...)`. No inventar permisos fuera de `src/lib/permissions.ts`; si falta uno, agregarlo ahí y avisar.
- **Baja lógica:** miembros y usuarios se desactivan con `active = false`, nunca `delete`.
- **Dinero:** `Decimal` en BD; nunca `Float`. Formatear con `Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })`.
- **Donaciones anónimas:** `memberId` nulo es válido; no forzar asociación.
- **Finanzas:** solo roles con `donations:read` / `dashboard:finance` / `reports:finance`.
- Responsable de evento y coordinador de ministerio apuntan a `Member`, no a `User`.
- **Coordinador:** solo ve y edita sus ministerios (los que coordina el miembro vinculado a su usuario). En ministerios, eventos y asistencia usar `src/server/scope.ts`: `where: await ministryScope(user)` / `eventScope(user)` / `attendanceScope(user)` en las consultas, y `assertMinistryInScope(user, ministryId)` / `assertEventInScope(user, eventId)` en las server actions de escritura. Para los demás roles no filtran nada.
- Fechas: `DateTime` en BD; los horarios (`time`) son texto `"HH:mm"`.

## Cómo trabajar con un agente de IA (ahorrar tokens)

1. Una tarea concreta por sesión (ej. "implementa el módulo de donaciones siguiendo el patrón de usuarios").
2. No pegar archivos completos: basta el error y la función afectada.
3. Leer este archivo y `BACKLOG.md` antes de empezar; al terminar, actualizar el estado en `BACKLOG.md`.
4. No crear pruebas exhaustivas: basta con probar el flujo feliz de cada módulo a mano con los usuarios del seed.
5. No tocar `schema.prisma` sin avisar al equipo: un cambio de esquema afecta a los 4.

## Flujo de Git

- Rama `main` protegida: solo se entra por Pull Request con 1 revisión.
- Ramas: `feat/<modulo>-<detalle>`, `fix/<detalle>`.
- Commits chicos y frecuentes. Hacer `git pull --rebase origin main` antes de abrir PR.
- Cambios al esquema de Prisma: una sola persona (A) los hace, migra y avisa al grupo.

## Comandos útiles

```bash
npm run dev            # desarrollo
npm run typecheck      # revisar tipos antes de subir
npm run lint
npm run db:migrate     # nueva migración (A)
npm run db:seed        # datos de demostración
npm run db:studio      # explorar la BD
```

## Usuarios de demostración (los crea el seed)

`admin@`, `pastor@`, `secretario@`, `tesorero@`, `coordinador@` + `ecclesia.test`. Contraseña: la de `SEED_PASSWORD` (por defecto `Ecclesia2026!`).

## Estado

Ver `BACKLOG.md`.
