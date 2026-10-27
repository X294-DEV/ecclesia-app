# RF-03 — Asistencia

Validado el 27 de octubre de 2026 en `feat/asistencia`, con PostgreSQL 16 en Docker y Next.js compilado en `http://localhost:3001`.

## Comportamiento

- Selección de evento ACTIVO con fecha, hora y título.
- Una casilla por miembro activo: marcada = presente; sin marcar = ausente al guardar.
- Guardado transaccional mediante upsert del par evento/miembro. Repetir el guardado actualiza la lista, sin duplicarla.
- Una lista incompleta o desactualizada se rechaza y solicita recargar para no registrar como ausentes a miembros nuevos.
- Historial de la lista guardada y totales por evento. Los miembros inactivos conservan su historial.
- Eventos cancelados: solo consulta del historial; escritura bloqueada en servidor.
- Filtros desde/hasta inclusivos para historial por evento y resúmenes. La lista seleccionada se consulta independientemente del rango.
- Resúmenes semanales (lunes como inicio) y mensuales con groupBy de Prisma, según la fecha del evento. Fechas de calendario interpretadas en UTC.
- Los totales cuentan exclusivamente asistencias guardadas; los eventos sin lista muestran "Sin registrar". El porcentaje es presentes / (presentes + ausentes).
- Las listas y resúmenes del coordinador usan eventScope/attendanceScope; el guardado valida assertEventInScope y vuelve a consultar el evento dentro de su alcance.
- Sin cambios al esquema, al seed ni a los permisos compartidos. El reporte exportable RF-09 sigue como tarea separada.

## Verificación realizada

- `npm run typecheck`, `npm run lint` y `npm run build`: correctos.
- Docker Compose: base saludable, conservando el volumen existente.
- HTTP contra la aplicación compilada con los cinco usuarios del seed: permisos de lectura/escritura, rechazo de escrituras de pastor/tesorero y redirección al login sin sesión.
- Coordinador: se oculta un evento ajeno y se rechaza un POST directo con su ID.
- Alta y actualización de asistencia: mismo número e IDs de registros al guardar de nuevo, con cambio correcto de presentes/ausentes.
- Rechazo de lista parcial, evento cancelado y fechas inválidas.
- Rango de un día: incluye el evento de ese día y muestra porcentajes concordantes con PostgreSQL en los resúmenes semanal y mensual.
- Navegador: casillas precargadas, cambio de una casilla, mensaje de éxito, historial y resúmenes actualizados.

La prueba usa el evento de demostración "Reunión de jóvenes". La base local conserva su lista con 2 presentes y 11 ausentes. El evento se canceló temporalmente para probar el rechazo de escritura y se restauró a ACTIVO.

Evidencia visual: `asistencia-validada.png`.
