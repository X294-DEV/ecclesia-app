import type { ReactNode } from "react";
import { Arch, RoseWindow } from "@/components/ui/gothic";
import { cardFeaturedClass } from "@/components/ui/styles";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <RoseWindow className="pointer-events-none absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]" />
      <div className={`${cardFeaturedClass} relative w-full max-w-sm space-y-5`}>
        <div className="text-center">
          <Arch className="mx-auto mb-1" />
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand">Ecclesia</p>
          <h1 className="mt-2 text-xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
