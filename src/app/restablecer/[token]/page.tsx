import { AuthShell } from "@/components/layout/auth-shell";
import { ActionForm } from "@/components/ui/action-form";
import { resetPasswordAction } from "@/server/password-actions";

export const metadata = { title: "Nueva contraseña" };

export default async function RestablecerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <AuthShell title="Nueva contraseña" subtitle="Elige una contraseña de al menos 8 caracteres.">
      <ActionForm
        action={resetPasswordAction}
        submitLabel="Guardar contraseña"
        hidden={{ token }}
        fields={[
          {
            name: "password",
            label: "Contraseña nueva",
            type: "password",
            required: true,
            autoComplete: "new-password",
          },
          {
            name: "confirm",
            label: "Confirmar contraseña",
            type: "password",
            required: true,
            autoComplete: "new-password",
          },
        ]}
      />
    </AuthShell>
  );
}
