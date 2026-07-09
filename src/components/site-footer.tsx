export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Rekap Laporan 5W. All rights reserved.
      </div>
    </footer>
  );
}
