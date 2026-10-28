# Despliegue (Vercel + Neon)

Ambos tienen plan gratuito suficiente para la demo. Tiempo estimado: 15 minutos.

## 1. Base de datos en Neon

1. Crea una cuenta en <https://neon.tech> y un proyecto (región más cercana, p. ej. `us-east`).
2. En **Connection Details**, desactiva **Connection pooling** y copia la cadena de conexión
   (`postgresql://...neon.tech/neondb?sslmode=require`). Esa es tu `DATABASE_URL` de producción.
   Usamos la conexión directa porque `prisma migrate deploy` no funciona bien con el pooler.

## 2. Cargar tablas y datos de demostración (una sola vez, desde tu computadora)

```powershell
$env:DATABASE_URL="<cadena de Neon>"
npx prisma migrate deploy
npx prisma db seed
Remove-Item Env:DATABASE_URL
```

(En bash: `DATABASE_URL="<cadena>" npx prisma migrate deploy && DATABASE_URL="<cadena>" npx prisma db seed`.)

## 3. App en Vercel

1. Entra a <https://vercel.com> con la cuenta de GitHub del dueño del repo y elige **Add New → Project → ecclesia-app**.
2. Framework: Next.js (lo detecta solo). No cambies los comandos: Vercel usa el script
   `vercel-build` de `package.json`, que aplica las migraciones pendientes (`prisma migrate deploy`)
   y después compila.
3. **Environment Variables**:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | la cadena de Neon del paso 1 |
   | `AUTH_SECRET` | uno nuevo: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
   | `AUTH_URL` | la URL que te dé Vercel, p. ej. `https://ecclesia-app.vercel.app` (se usa en el enlace de recuperar contraseña) |
   | `RESEND_API_KEY` | opcional; sin ella el enlace de recuperación se muestra en pantalla |

4. **Deploy**. Cada merge a `main` vuelve a desplegar solo.

Si cambias `AUTH_URL` después del primer despliegue, vuelve a desplegar (**Deployments → Redeploy**).

## 4. Comprobar

- Entra con `admin@ecclesia.test` / `Ecclesia2026!`.
- Corre la revisión de permisos contra producción:
  `BASE_URL=https://<tu-app>.vercel.app npm run check:permisos`
  (PowerShell: `$env:BASE_URL="https://..."; npm run check:permisos`).

## Notas

- **Archivos subidos:** en Vercel el disco es de solo lectura. El logo de la iglesia se guarda
  como data URL en la base de datos (`Church.logoUrl`), no en `public/uploads`.
- **Cambios al esquema:** basta con mergear la migración a `main`; `vercel-build` la aplica en el
  siguiente despliegue.
- **Datos de demo:** el seed no borra nada; si ya hay miembros, omite los datos de demostración.
