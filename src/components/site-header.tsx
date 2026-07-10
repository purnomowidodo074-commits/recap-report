import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
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
            Sistem Manajemen &amp;
            <br />
            Rekap Laporan PDF
          </span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-red-700"
          >
            Form Laporan
          </Link>
          <Link
            href="/rekap"
            className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-red-700"
          >
            Rekap Data
          </Link>
        </nav>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="h-1 bg-red-600" />
        <div className="h-1 bg-red-800" />
      </div>
    </header>
  );
}
