// Revisión automática de permisos por rol (tarea de A en BACKLOG.md).
// Inicia sesión con cada usuario del seed y comprueba, contra la app ya levantada, que:
//   1. el menú muestra exactamente los módulos que su rol permite (src/lib/nav.ts),
//   2. cada página abre (200) o manda a /no-autorizado según el permiso,
//   3. cada reporte de REPORTS se descarga (200) o se rechaza (403).
// Uso: con `npm run dev` o `npm start` corriendo, en otra terminal:
//   npm run check:permisos              (BASE_URL=http://localhost:3000 por defecto)
import { NAV_ITEMS } from "@/lib/nav";
import { can, type Role } from "@/lib/permissions";
import { REPORTS } from "@/server/reports";

// Sin "/" final: una doble barra en la URL hace que el POST del login se redirija y se pierda.
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").trim().replace(/\/+$/, "");
const PASSWORD = process.env.SEED_PASSWORD ?? "Ecclesia2026!";
const ROLES: Role[] = ["ADMIN", "PASTOR", "SECRETARIO", "TESORERO", "COORDINADOR"];

function cookieHeader(response: Response, jar: Map<string, string>) {
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function login(email: string) {
  const jar = new Map<string, string>();
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  cookieHeader(csrfResponse, jar);

  const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookieHeader(csrfResponse, jar) },
    body: new URLSearchParams({ csrfToken, email, password: PASSWORD }),
  });
  const cookie = cookieHeader(response, jar);
  if (!cookie.includes("session-token")) {
    const location = response.headers.get("location") ?? "(sin redirección)";
    throw new Error(
      `No se pudo iniciar sesión con ${email}\n` +
        `  respuesta: ${response.status} -> ${location}\n` +
        `  Si termina en error=CredentialsSignin: el usuario no existe o la contraseña no coincide con SEED_PASSWORD.\n` +
        `  Si termina en error=Configuration: revisa AUTH_SECRET y la base en Vercel.`,
    );
  }
  return cookie;
}

async function main() {
  const failures: string[] = [];
  let checks = 0;
  const expect = (ok: boolean, message: string) => {
    checks++;
    if (!ok) failures.push(message);
  };

  for (const role of ROLES) {
    const email = `${role.toLowerCase()}@ecclesia.test`;
    const cookie = await login(email);
    const get = (path: string) => fetch(`${BASE_URL}${path}`, { redirect: "manual", headers: { Cookie: cookie } });

    const home = await (await get("/inicio")).text();
    for (const item of NAV_ITEMS) {
      const allowed = !item.anyOf || item.anyOf.some((action) => can(role, action));

      const inMenu = home.includes(`href="${item.href}"`);
      expect(inMenu === allowed, `${role}: el menú ${allowed ? "no muestra" : "muestra"} ${item.href}`);

      const response = await get(item.href);
      const location = response.headers.get("location") ?? "";
      if (allowed) {
        expect(response.status === 200, `${role}: ${item.href} debería abrir y respondió ${response.status} ${location}`);
      } else {
        expect(location.includes("/no-autorizado"), `${role}: ${item.href} debería mandar a /no-autorizado y respondió ${response.status}`);
      }
    }

    for (const [key, report] of Object.entries(REPORTS)) {
      const allowed = can(role, report.permission);
      const response = await get(`/reportes/exportar/${key}?formato=xlsx`);
      expect(response.status === (allowed ? 200 : 403), `${role}: reporte ${key} respondió ${response.status}`);
    }
    console.log(`✓ ${role} revisado`);
  }

  console.log(`\n${checks - failures.length}/${checks} comprobaciones correctas.`);
  if (failures.length) {
    console.error("\nFallos:\n" + failures.map((failure) => `  ✗ ${failure}`).join("\n"));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
