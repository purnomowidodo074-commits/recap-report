"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Form Laporan" },
  { href: "/rekap", label: "Rekap Data" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 bg-neutral-50">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={64}
            height={40}
            className="h-10 w-16 object-contain"
          />
          <span className="text-sm leading-tight font-semibold">
            Sistem Management
            <br />
            5 Way Report
          </span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  isActive
                    ? "bg-red-600 text-white"
                    : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="h-1 bg-red-600" />
        <div className="h-1 bg-red-800" />
      </div>
    </header>
  );
}
