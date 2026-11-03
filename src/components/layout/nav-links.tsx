"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`font-display whitespace-nowrap rounded-md border px-3 py-2 text-sm tracking-wide ${
              active
                ? "border-brand bg-brand text-brand-foreground"
                : "border-transparent hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
