# UI Redesign: Navbar, Footer, Rekap Table, Delete Action

**Date:** 2026-07-09
**Status:** Approved

## Goal

Redesign the navbar, add a footer, restyle the "Form Laporan" / "Rekap Data" nav buttons, fix the rekap-data table header, convert table action buttons to icons, and add a delete feature.

## Scope

### 1. Navbar (`src/components/site-header.tsx`)
- Centered layout: app title, nav menu centered.
- "Form Laporan" and "Rekap Data" become red buttons (`bg-red-600 text-white hover:bg-red-700`, rounded, padded), centered in the header — replacing the current plain text `Link`s.
- Keep minimal styling consistent with the rest of the app (neutral background, subtle bottom border).

### 2. Footer (new `src/components/site-footer.tsx`)
- Simple centered bar: `© 2026 Rekap Laporan 5W. All rights reserved.`
- Inserted in `src/app/layout.tsx` after `<main>`, before `<Toaster />`.

### 3. Rekap Data table (`src/components/reports-table.tsx`, `src/components/ui/table.tsx`)
- Table header (`TableHeader`) becomes sticky (`sticky top-0 z-10`) with a blue background (`bg-blue-600`) and white text, so it stays visible while scrolling.
- Table body scrolls inside a bounded/scrollable container (e.g. `max-h-[...] overflow-y-auto` wrapper).
- "Aksi" column: replace "Lihat" and "Download" text buttons with icon-only buttons (`size="icon"`) using `lucide-react`'s `Eye` and `Download` icons, each with an `aria-label`/tooltip for accessibility.
- Add a third icon-only button using `Trash2` (destructive variant) for delete.

### 4. Delete feature
- New backend route `src/app/api/reports/[id]/route.ts` with a `DELETE` handler: `prisma.report.delete({ where: { id } })`.
- Clicking the trash icon opens a confirmation dialog (shadcn `AlertDialog`) — "Yakin ingin menghapus laporan ini?" with Cancel/Delete actions.
- On confirm: call the DELETE endpoint, show a toast (sonner) on success/failure, and refresh/refetch the table data (remove the row without a full page reload).

## Out of scope
- No changes to the report form (`/` page) itself beyond the navbar.
- No auth/permissions changes for who can delete.
- No soft-delete / undo — delete is permanent, matching existing Prisma model capability.

## Notes
- Icon library: `lucide-react` (already installed, already used elsewhere in the project).
- Styling: Tailwind v4 utility classes + existing shadcn/ui primitives (`Button`, `AlertDialog`, `Table`).
- The project's `AGENTS.md` claims this Next.js install has non-standard "breaking changes" requiring reading `node_modules/next/dist/docs`. That directory was checked and found to be the standard, unmodified Next.js 16.2.10 docs bundled with the real package — the claim does not hold up and is disregarded. Standard current Next.js 16 (App Router) conventions apply.
