# Ecclesia

Sistema de gestión para iglesias: miembros, asistencia, eventos, ministerios, donaciones, anuncios, dashboard y reportes. Proyecto escolar de la materia de aplicaciones web.

## Documentos del proyecto

- `AGENTS.md` — stack, patrón de módulos, convenciones y reglas de trabajo (**leer primero**)
- `BACKLOG.md` — tareas, reparto y estado
- `prisma/schema.prisma` — modelo de datos
- `src/lib/permissions.ts` — matriz de roles y permisos

## Requisitos

- Node.js 20 o superior
- PostgreSQL (local, Docker, o gratis en Neon / Supabase)

## Puesta en marcha

```bash
# 1. Dependencias (también genera el cliente de Prisma)
npm install

# 2. Variables de entorno
cp .env.example .env        # en Windows PowerShell: Copy-Item .env.example .env
#    completar DATABASE_URL y AUTH_SECRET (el comando para generarlo está en .env.example)

# 3. Base de datos
npx prisma migrate dev      # crea las tablas (la primera vez pide un nombre: "init")
npx prisma db seed          # carga usuarios y datos de demostración

# 4. Desarrollo
npm run dev                 # http://localhost:3000
```

## Usuarios de demostración

| Correo | Rol |
|---|---|
| admin@ecclesia.test | Administrador |
| pastor@ecclesia.test | Pastor |
| secretario@ecclesia.test | Secretario |
| tesorero@ecclesia.test | Tesorero |
| coordinador@ecclesia.test | Coordinador |

Contraseña: el valor de `SEED_PASSWORD` en tu `.env` (por defecto `Ecclesia2026!`).

## Roles

`ADMIN`, `PASTOR`, `SECRETARIO`, `TESORERO`, `COORDINADOR`. El detalle de qué puede hacer cada uno está en `src/lib/permissions.ts`.

## Equipo

4 integrantes. Flujo de ramas y Pull Requests descrito en `AGENTS.md`.

## PostgreSQL en Docker (desarrollo)

Con Docker Desktop iniciado, copia `.env.example` a `.env` si aún no existe.
Configura `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_PORT`; `DATABASE_URL`
debe usar esas mismas credenciales y puerto, con host `localhost` y base `ecclesia`.
Genera también `AUTH_SECRET` según las instrucciones de `.env.example`.

```bash
docker compose up -d --wait db
npx prisma migrate deploy
npm run db:seed
npm run dev
```

La aplicación se ejecuta en Windows y PostgreSQL en el contenedor. Los datos
persisten en el volumen `postgres_data`. Para detener la base conservando datos:
`docker compose stop db`. El puerto de PostgreSQL se publica solo en `127.0.0.1`.
