export function SiteFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 h-16 border-t bg-white">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-center px-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Sistem Management 5 Way Report. All rights reserved.
      </div>
    </footer>
  );
}
