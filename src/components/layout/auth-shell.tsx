import type { ReactNode } from "react";
import { cardClass } from "@/components/ui/styles";

/** Contenedor centrado para las pantallas públicas (login, recuperar, restablecer). */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className={`${cardClass} w-full max-w-sm space-y-5`}>
        <div>
          <p className="text-sm font-semibold text-brand">Ecclesia</p>
          <h1 className="mt-1 text-xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
