# AGENTS.md — Sistema de gestión para iglesias

Proyecto escolar (materia de aplicaciones web). Entrega: **3 de noviembre de 2026**.
Objetivo: cubrir los requerimientos funcionales RF-01 a RF-10 con algo que funcione y se pueda demostrar. No sobreingenierizar.

## Stack

- Next.js (App Router) + TypeScript
- PostgreSQL + Prisma **6** (esquema en `prisma/schema.prisma`). Fijar versión: `npm i prisma@6 @prisma/client@6`; Prisma 7 mueve la URL de la BD a `prisma.config.ts` y este esquema usa `url = env("DATABASE_URL")`.
- Auth.js (credenciales: correo + contraseña, hash con bcrypt)
- Tailwind + shadcn/ui
- Validación: Zod
- Calendario: FullCalendar · Gráficas: Recharts · Excel: exceljs · PDF: @react-pdf/renderer o jsPDF + autotable

## Convenciones

- Idioma de la UI y de los mensajes: **español**. Código, nombres de variables y commits en inglés.
- Estructura por módulo: `src/app/(app)/<modulo>/` (páginas), `src/server/<modulo>/` (acciones y consultas), `src/components/<modulo>/`.
- **Permisos:** todo endpoint o server action empieza con `assertCan(role, "<accion>")` de `src/lib/permissions.ts`. El menú usa `can()` para ocultar opciones. No inventar permisos fuera de ese archivo.
- **Baja lógica:** miembros y usuarios se desactivan con `active = false`, nunca `delete`.
- **Dinero:** `Decimal` en BD; nunca `Float`. Formatear con `Intl.NumberFormat("es-MX")`.
- **Donaciones anónimas:** `memberId` nulo es válido; no forzar asociación.
- **Finanzas:** solo roles con `donations:read` / `dashboard:finance` / `reports:finance`.
- Responsable de evento y coordinador de ministerio apuntan a `Member`, no a `User`.
- Reutilizar el componente genérico de tabla + formulario CRUD (se crea en el módulo 0); los demás módulos se piden como "igual que X pero con estos campos".

## Cómo trabajar con un agente de IA (ahorrar tokens)

1. Una tarea concreta por sesión (ej. "implementa el módulo de donativos siguiendo el patrón de miembros").
2. No pegar archivos completos: basta el error y la función afectada.
3. Leer este archivo y `BACKLOG.md` antes de empezar; al terminar, actualizar el estado en `BACKLOG.md`.
4. No crear pruebas exhaustivas: basta con probar el flujo feliz de cada módulo a mano.
5. No tocar `schema.prisma` sin avisar al equipo: un cambio de esquema afecta a los 4.

## Flujo de Git

- Rama `main` protegida: solo se entra por Pull Request con 1 revisión.
- Ramas: `feat/<modulo>-<detalle>`, `fix/<detalle>`.
- Commits chicos y frecuentes. Hacer `git pull --rebase origin main` antes de abrir PR.
- Cambios al esquema de Prisma: una sola persona los hace, migra y avisa al grupo.

## Estado

Ver `BACKLOG.md`.
