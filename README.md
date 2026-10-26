# Sistema de gestión para iglesias

Aplicación web para administrar miembros, asistencia, eventos, ministerios, donaciones, anuncios y reportes de una iglesia. Proyecto escolar de la materia de aplicaciones web.

## Documentos del proyecto

- `AGENTS.md` — stack, convenciones y reglas de trabajo (leer primero)
- `BACKLOG.md` — tareas, reparto y estado
- `prisma/schema.prisma` — modelo de datos
- `src/lib/permissions.ts` — matriz de roles y permisos

## Requisitos

- Node.js 20 o superior
- PostgreSQL (local, Docker, Neon o Supabase)

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env     # completar DATABASE_URL y AUTH_SECRET

# 2. Dependencias (Prisma fijado en 6, ver AGENTS.md)
npm install
npm i prisma@6 @prisma/client@6

# 3. Base de datos
npx prisma migrate dev
npx prisma db seed       # cuando exista el seed

# 4. Desarrollo
npm run dev
```

Antes de que exista el scaffolding de Next.js, la persona que lo cree (ver `BACKLOG.md`, Fase 0) debe correr `create-next-app` dentro de este repositorio conservando los archivos existentes.

## Roles

`ADMIN`, `PASTOR`, `SECRETARIO`, `TESORERO`, `COORDINADOR`. El detalle de qué puede hacer cada uno está en `src/lib/permissions.ts`.

## Equipo

4 integrantes. Flujo de ramas y Pull Requests descrito en `AGENTS.md`.
