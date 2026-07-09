import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-4">
        <span className="text-lg font-semibold">Rekap Laporan 5W</span>
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
