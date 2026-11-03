import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { ActionForm } from "@/components/ui/action-form";
import { loginAction } from "@/server/auth-actions";
import { getCurrentUser } from "@/server/session";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  // getCurrentUser() verifica en la BD; así una cookie de un usuario desactivado no causa un ciclo de redirecciones.
  if (await getCurrentUser()) redirect("/inicio");

  const { reset } = await searchParams;

  return (
    <AuthShell
      title="Bienvenido"
      subtitle="Accede a tu comunidad"
      footer="¿Necesitas ayuda? Contacta a tu iglesia."
    >
      {reset && (
        <p role="status" className="text-sm text-success">
          Tu contraseña se actualizó. Ya puedes iniciar sesión.
        </p>
      )}
      <ActionForm
        action={loginAction}
        submitLabel="Iniciar sesión"
        block
        fields={[
          { name: "email", label: "Correo electrónico", type: "email", required: true, autoComplete: "username", icon: "mail", placeholder: "tu@correo.com" },
          {
            name: "password",
            label: "Contraseña",
            type: "password",
            required: true,
            autoComplete: "current-password",
            icon: "lock",
          },
        ]}
      />
      <Link href="/recuperar" className="block text-sm text-muted underline">
        ¿Olvidaste tu contraseña?
      </Link>
    </AuthShell>
  );
}
