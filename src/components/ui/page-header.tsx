import type { ReactNode } from "react";
import { Arch, GothicDivider } from "@/components/ui/gothic";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Arch className="mb-1" />
          <h1 className="text-2xl font-semibold text-brand">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
      <GothicDivider className="mt-4" />
    </div>
  );
}
