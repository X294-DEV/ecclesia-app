import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";
import { ActionForm } from "@/components/ui/action-form";
import { requestResetAction } from "@/server/password-actions";

export const metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una contraseña nueva."
    >
      <ActionForm
        action={requestResetAction}
        submitLabel="Enviar enlace"
        fields={[{ name: "email", label: "Correo", type: "email", required: true }]}
      />
      <Link href="/login" className="block text-sm text-muted underline">
        Volver a iniciar sesión
      </Link>
    </AuthShell>
  );
}
