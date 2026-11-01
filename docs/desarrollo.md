# Desarrollo local

**Producción ya existe** (Vercel + Neon) y se actualiza sola al mergear a `main`.
La `DATABASE_URL` de Neon es secreta y solo la tiene A: **nadie más la necesita ni debe pedirla**.
Cada integrante trabaja con su propio Postgres local, así sus pruebas no afectan a los demás.

## Preparar tu entorno (una vez)

1. Postgres local: `docker compose up -d` (necesita `POSTGRES_PASSWORD` en `.env`) o cualquier Postgres 16.
2. Copia `.env.example` a `.env` y ajusta:
   - `DATABASE_URL=postgresql://ecclesia:<tu-password>@localhost:5432/ecclesia`
   - `AUTH_SECRET=` cualquier cadena larga (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
3. `npm install`, `npx prisma migrate dev`, `npx prisma db seed`.
4. `npm run dev` → entra con `admin@ecclesia.test` / `Ecclesia2026!`.

## Reglas

- `migrate dev` solo contra tu base local, nunca contra Neon.
- No cambies `prisma/schema.prisma`; si necesitas un campo o tabla, avisa a A. A crea la migración y,
  al mergearla a `main`, Vercel la aplica sola (`vercel-build` ejecuta `prisma migrate deploy`).
  Después haz `git pull` y `npx prisma migrate dev` para traerla a tu base local.
- Los PR generan un preview en Vercel, pero usa la base de producción: no pruebes ahí crear o borrar datos.
- Nunca subas `.env` ni pegues credenciales en el repo, PR o chats.
