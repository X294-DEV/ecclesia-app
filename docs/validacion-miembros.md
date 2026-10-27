# RF-02 — Validación de Miembros

Validado el 27 de octubre de 2026 en `feat/miembros`, con PostgreSQL 16 en Docker Compose y la aplicación ejecutada mediante `npm run start`.

## Implementación

- Alta y edición de nombre, teléfono, correo y fecha de ingreso.
- Teléfono y correo opcionales; correo validado cuando se captura.
- Búsqueda parcial por nombre sin distinguir mayúsculas (`?q=`).
- Filtro `?estado=activo` o `?estado=inactivo`; sin filtro muestra ambos.
- Desactivación y reactivación idempotentes; nunca elimina registros.
- Fechas guardadas y mostradas en UTC para conservar el día seleccionado.
- Sin cambios al esquema de Prisma ni a la matriz de permisos.

## Comprobaciones realizadas

- `npm run typecheck`: correcto.
- `npm run lint`: correcto.
- `npm run build`: correcto, incluida generación de páginas.
- `docker compose config --quiet`: correcto.
- PostgreSQL con healthcheck saludable; migración existente aplicada con `prisma migrate deploy` y seed cargado.
- En navegador como ADMIN: alta, edición de nombre y fecha, vaciado de contactos, búsqueda parcial, búsqueda en mayúsculas, filtros, desactivación, reactivación y listado sin resultados.
- Por HTTP contra la aplicación compilada: ADMIN y SECRETARIO ven formularios de escritura; PASTOR y COORDINADOR solo consulta; TESORERO se redirige a `/no-autorizado`; visitante sin sesión se redirige a login.
- Envío directo de la acción de alta como PASTOR, COORDINADOR y TESORERO: rechazado mediante redirección a `/no-autorizado`.
- Datos inválidos enviados directamente al servidor: rechazados con mensaje de validación.
- Alta como SECRETARIO sin teléfono ni correo: correcta.

La base local conserva dos miembros de prueba, identificados con el prefijo `Prueba`, para revisar el resultado. No se eliminaron registros. Evidencia visual: `miembros-validado.png`.

## Repetir la verificación

Configurar `.env` según README, iniciar Docker Desktop y ejecutar:

```bash
docker compose up -d --wait db
npx prisma migrate deploy
npm run db:seed
npm run build
npm run start
```

Abrir `/miembros` con los usuarios del seed. La contraseña es la configurada en `SEED_PASSWORD`. `.env` está excluido de Git.
