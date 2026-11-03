import type { ReactNode } from "react";
import { NaveScene } from "@/components/layout/nave-scene";
import { Arch, GothicDivider, OgivePanel } from "@/components/ui/gothic";

/** Contenedor para las pantallas públicas (login, recuperar, restablecer): nave de catedral y panel ojival. */
export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Texto de ayuda debajo del formulario. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <NaveScene />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6 lg:justify-end lg:pr-[7vw]">
        <OgivePanel className="w-full max-w-[30rem]" bodyClassName="px-8 pb-7 pt-1">
          <div className="space-y-5">
            <div className="text-center">
              <Arch className="mx-auto mb-1 h-8 w-12" />
              <p className="font-display text-base text-muted">Ecclesia</p>
              <h1 className="mt-1 font-display text-4xl font-bold leading-tight">{title}</h1>
              <GothicDivider className="mx-auto my-3 max-w-[16rem]" />
              {subtitle && <p className="text-base text-muted">{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="border-t border-brand/40 pt-4 text-center text-sm text-muted">{footer}</div>}
          </div>
        </OgivePanel>
      </div>
    </main>
  );
}
