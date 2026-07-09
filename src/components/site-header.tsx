import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={32} height={32} />
          <span className="text-lg font-semibold">
            Sistem Manajemen &amp; Rekap Laporan PDF
          </span>
        </div>
        <nav className="flex items-center justify-center gap-3 text-sm">
          <Link
            href="/"
            className="rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
          >
            Form Laporan
          </Link>
          <Link
            href="/rekap"
            className="rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
          >
            Rekap Data
          </Link>
        </nav>
      </div>
    </header>
  );
}
