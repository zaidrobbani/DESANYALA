"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LogoLockup from "@/shared/component/LogoLockup";
import { NAV_ITEMS, ROUTES } from "@/shared/constant/routes";

const TopNav = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-line border-b bg-surface px-4 sm:px-8">
      <div className="flex items-center gap-12">
        <Link href={ROUTES.beranda} aria-label="DesaNyala, ke beranda">
          <LogoLockup />
        </Link>
        <nav aria-label="Navigasi utama" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => {
              const isActive = item.match(pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "transition-colors hover:text-brand",
                      isActive
                        ? "text-body-strong text-brand"
                        : "text-body text-fg-secondary",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <Button
        asChild
        className="h-[38px] rounded-md px-4 text-body-strong hover:bg-brand-hover"
      >
        <Link href={ROUTES.simulasi}>Mulai simulasi</Link>
      </Button>
    </header>
  );
};

export default TopNav;
