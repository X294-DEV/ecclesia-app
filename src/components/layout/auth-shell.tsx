import type { ReactNode } from "react";
import { NaveScene } from "@/components/layout/nave-scene";
import { Arch, OgivePanel } from "@/components/ui/gothic";

/** Contenedor para las pantallas públicas (login, recuperar, restablecer): nave de catedral y panel ojival. */
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
    <main className="relative min-h-screen overflow-hidden">
      <NaveScene />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6 lg:justify-end lg:pr-[8vw]">
        <OgivePanel className="w-full max-w-md">
          <div className="space-y-5">
            <div className="text-center">
              <Arch className="mx-auto mb-1" />
              <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand">Ecclesia</p>
              <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            {children}
          </div>
        </OgivePanel>
      </div>
    </main>
  );
}
