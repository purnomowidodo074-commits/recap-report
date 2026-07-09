import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <span className="text-lg font-semibold">Rekap Laporan 5W</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Form Laporan
          </Link>
          <Link href="/rekap" className="hover:underline">
            Rekap Data
          </Link>
        </nav>
      </div>
    </header>
  );
}
