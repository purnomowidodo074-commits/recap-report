# UI Redesign: Navbar, Footer, Rekap Table, Delete Action — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the navbar and add a footer, restyle the "Form Laporan"/"Rekap Data" nav links as centered red buttons, fix the rekap-data table with a sticky blue header, replace the "Lihat"/"Download" action buttons with icons, and add a delete feature (backend + confirmation UI).

**Architecture:** Pure frontend/UI changes to two existing components (`site-header.tsx`, `reports-table.tsx`) plus one new component (`site-footer.tsx`) and one new shadcn UI primitive (`alert-dialog.tsx`), plus one new Next.js Route Handler (`app/api/reports/[id]/route.ts`) for `DELETE`. No schema changes — `Report.delete` is already supported by the existing Prisma model.

**Tech Stack:** Next.js 16 (App Router, Route Handlers with `params: Promise<...>`), React, TypeScript, Tailwind CSS v4, shadcn/ui conventions on the unified `radix-ui` package, `lucide-react` icons, `sonner` toasts, Prisma.

## Global Constraints

- Spec source: `docs/superpowers/specs/2026-07-09-ui-redesign-navbar-footer-table-design.md`.
- Icon library: `lucide-react` only (already installed) — do not add any other icon package.
- Styling: Tailwind utility classes + existing shadcn/ui primitives only — no new CSS files, no CSS Modules, no styled-components.
- Red buttons: `bg-red-600 text-white hover:bg-red-700`. Blue table header: `bg-blue-600` with white header text. These are literal Tailwind classes (the project's theme has no existing blue/red tokens), matching the approved design.
- Next.js 16 Route Handler dynamic params are `Promise<{ id: string }>` — follow the exact pattern already used in `src/app/api/reports/[id]/download/route.ts:8-12`.
- **No automated test runner is configured in this project** (`package.json` scripts are only `dev`, `build`, `start` — no `test` script, no Jest/Vitest/Playwright). Every task therefore substitutes automated tests with: (1) `npx tsc --noEmit` for type safety, and (2) an explicit manual verification step (start `npm run dev`, open the relevant page/route, check specific visible behavior). Do not skip the manual verification step — it is the only correctness gate available here.
- Delete is permanent (no soft-delete/undo), matching current Prisma model capability.

---

### Task 1: Redesign navbar — centered layout, red buttons

**Files:**
- Modify: `src/components/site-header.tsx` (full file, currently 18 lines)

**Interfaces:**
- Consumes: nothing new.
- Produces: no exported signature change — `SiteHeader` remains a zero-prop component imported by `src/app/layout.tsx:1-19` as `<SiteHeader />`. Later tasks don't depend on any new export from this file.

- [ ] **Step 1: Replace the file contents**

Replace all of `src/components/site-header.tsx` with:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `site-header.tsx`.

- [ ] **Step 3: Manual verification**

Run: `npm run dev` (if not already running), then open `http://localhost:3000/` in a browser.
Expected: header shows "Rekap Laporan 5W" centered above two red, white-text, rounded buttons labeled "Form Laporan" and "Rekap Data", both horizontally centered in the header. Clicking "Rekap Data" navigates to `/rekap`; clicking "Form Laporan" navigates to `/`.

- [ ] **Step 4: Commit**

```bash
git add src/components/site-header.tsx
git commit -m "feat: redesign navbar with centered red nav buttons"
```

---

### Task 2: Add footer component

**Files:**
- Create: `src/components/site-footer.tsx`
- Modify: `src/app/layout.tsx:1-19`

**Interfaces:**
- Consumes: nothing.
- Produces: `SiteFooter` — a zero-prop component, imported by `src/app/layout.tsx`. No other task depends on it.

- [ ] **Step 1: Create the footer component**

Create `src/components/site-footer.tsx`:

```tsx
export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Rekap Laporan 5W. All rights reserved.
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Wire the footer into the root layout**

In `src/app/layout.tsx`, add the import next to the existing `SiteHeader` import:

```tsx
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
```

Then update the `<body>` contents so the footer renders after `<main>` and before `<Toaster />`:

```tsx
      <body className={`${inter.className} bg-white text-gray-900`}>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter />
        <Toaster />
      </body>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `site-footer.tsx` or `layout.tsx`.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/` and `http://localhost:3000/rekap`.
Expected: both pages show a footer at the bottom reading "© 2026 Rekap Laporan 5W. All rights reserved." (year is dynamic — confirm it matches the current year), centered, with a top border separating it from page content.

- [ ] **Step 5: Commit**

```bash
git add src/components/site-footer.tsx src/app/layout.tsx
git commit -m "feat: add site footer"
```

---

### Task 3: Sticky blue table header on Rekap Data

**Files:**
- Modify: `src/components/reports-table.tsx:142-151` (the `<Table>`/`<TableHeader>` block)

**Interfaces:**
- Consumes: `Table`, `TableHeader`, `TableRow`, `TableHead` from `@/components/ui/table` (unchanged signatures — `className` passthrough already supported per `src/components/ui/table.tsx:22-30,68-79`).
- Produces: no new exports. Task 4 continues editing this same file's `<TableBody>` action cells — do not reorder or remove the `<TableHeader>` block Task 4 will follow.

- [ ] **Step 1: Wrap the table in a scrollable container and style the header**

In `src/components/reports-table.tsx`, replace:

```tsx
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Line</TableHead>
              <TableHead>Nama Mesin</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
```

with:

```tsx
        <div className="max-h-[480px] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-blue-600">
            <TableRow className="border-b-0 hover:bg-blue-600">
              <TableHead className="text-white">Tanggal</TableHead>
              <TableHead className="text-white">Line</TableHead>
              <TableHead className="text-white">Nama Mesin</TableHead>
              <TableHead className="text-white">Problem</TableHead>
              <TableHead className="text-right text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
```

Then find the closing `</Table>` for this table (immediately before the pagination block starting with `{data && data.totalPages > 1 && (`) and add a closing `</div>` right after it:

```tsx
        </Table>
        </div>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `reports-table.tsx`.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/rekap`.
Expected: table header row ("Tanggal", "Line", "Nama Mesin", "Problem", "Aksi") has a solid blue background with white text. If there are enough rows to exceed 480px of body height, scrolling the table body keeps the blue header pinned at the top (test by temporarily changing a filter to show more rows, or resizing the browser window shorter). With few rows, confirm the layout still looks correct (bordered box, no broken height).

- [ ] **Step 4: Commit**

```bash
git add src/components/reports-table.tsx
git commit -m "feat: add sticky blue header to rekap data table"
```

---

### Task 4: Replace Lihat/Download text buttons with icon buttons

**Files:**
- Modify: `src/components/reports-table.tsx` (imports block, and the "Aksi" `<TableCell>` inside the row `.map`)

**Interfaces:**
- Consumes: `Eye`, `Download` icons from `lucide-react` (already a project dependency); existing `Tooltip`/`TooltipTrigger`/`TooltipContent` already imported at `src/components/reports-table.tsx:23-28`; existing `Button` component's `icon` size variant (`src/components/ui/button.tsx:28`).
- Produces: no new exports. Task 7 will add a third icon (`Trash2`) to this same `<TableCell>` — leave the two-icon structure in place for Task 7 to extend, don't restructure the cell into something Task 7's plan doesn't expect.

- [ ] **Step 1: Add the icon imports**

In `src/components/reports-table.tsx`, add near the top (after the existing `"use client"` and React imports, alongside other third-party imports):

```tsx
import { Download, Eye } from "lucide-react";
```

- [ ] **Step 2: Replace the action buttons**

Replace:

```tsx
                  <TableCell className="space-x-2 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/${report.filePath}`} target="_blank" rel="noreferrer">
                        Lihat
                      </a>
                    </Button>
                    <Button size="sm" onClick={() => handleDownload(report.id)}>
                      Download
                    </Button>
                  </TableCell>
```

with:

```tsx
                  <TableCell className="space-x-2 text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" asChild>
                          <a
                            href={`/${report.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Lihat laporan"
                          >
                            <Eye className="size-4" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Lihat</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          aria-label="Download laporan"
                          onClick={() => handleDownload(report.id)}
                        >
                          <Download className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download</TooltipContent>
                    </Tooltip>
                  </TableCell>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `reports-table.tsx`.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/rekap` (with at least one report row — create one via the form at `/` first if the table is empty).
Expected: the "Aksi" column shows two small square icon buttons (an eye outline icon, a filled download icon) instead of text buttons. Hovering each shows a tooltip ("Lihat" / "Download"). Clicking the eye icon opens the PDF in a new tab; clicking the download icon downloads the merged PDF (same behavior as before, just triggered from the icon).

- [ ] **Step 5: Commit**

```bash
git add src/components/reports-table.tsx
git commit -m "feat: convert lihat/download table actions to icon buttons"
```

---

### Task 5: Add DELETE endpoint for reports

**Files:**
- Create: `src/app/api/reports/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma` (existing export, same as used in `src/app/api/reports/route.ts:2` and `src/app/api/reports/[id]/download/route.ts:4`).
- Produces: `DELETE /api/reports/:id` — on success returns `200` with JSON `{ success: true }`; on missing report returns `404` with JSON `{ error: string }`; on failure returns `500` with JSON `{ error: string }`. Task 7's `handleDelete` fetch call depends on this exact contract (status codes and the `error` field name on failure responses).

- [ ] **Step 1: Create the route handler**

Create `src/app/api/reports/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.report.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  try {
    await prisma.report.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus laporan" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `src/app/api/reports/[id]/route.ts`.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. In a separate terminal, create a throwaway report through the UI at `http://localhost:3000/` (fill the form, upload any small PDF), then find its id — the easiest way is `npx prisma studio` (opens a local DB browser) to copy the new row's `id`, or read it from the Network tab response of the `POST /api/reports` call made when submitting the form.

Then run (replace `<id>` with the copied id):
`curl -i -X DELETE http://localhost:3000/api/reports/<id>`
Expected: `HTTP/1.1 200 OK` with body `{"success":true}`. Re-running the same command with the same `<id>` now returns `HTTP/1.1 404` with `{"error":"Laporan tidak ditemukan"}` (since it was already deleted). Confirm in Prisma Studio (or by refreshing `/rekap`) that the row is gone.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/reports/[id]/route.ts"
git commit -m "feat: add DELETE endpoint for reports"
```

---

### Task 6: Add AlertDialog UI primitive

**Files:**
- Create: `src/components/ui/alert-dialog.tsx`

**Interfaces:**
- Consumes: `buttonVariants` from `@/components/ui/button` (existing export, `src/components/ui/button.tsx:64`); `AlertDialog` namespace from the `radix-ui` package (same unified-package pattern already used in `src/components/ui/tooltip.tsx:4`).
- Produces: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel` — Task 7 imports all of these by these exact names from `@/components/ui/alert-dialog`.

- [ ] **Step 1: Create the component**

Create `src/components/ui/alert-dialog.tsx`:

```tsx
"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `alert-dialog.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/alert-dialog.tsx
git commit -m "feat: add AlertDialog UI primitive"
```

(No standalone manual-verification step here — this primitive has no page wired to it yet; it is verified end-to-end in Task 7.)

---

### Task 7: Wire delete icon button with confirmation dialog

**Files:**
- Modify: `src/components/reports-table.tsx` (imports, add `handleDelete` + `deletingId` state, extend the "Aksi" `<TableCell>` from Task 4)

**Interfaces:**
- Consumes: `DELETE /api/reports/:id` from Task 5 (200 + `{success:true}` on success; non-2xx + `{error:string}` on failure); `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel` from Task 6's `@/components/ui/alert-dialog`; `Trash2` icon from `lucide-react`; existing `ReportRow`/`ReportsResponse` types and `setData` state setter already defined in this file (`src/components/reports-table.tsx:32-47,66`).
- Produces: nothing consumed by later tasks — this is the final implementation task.

- [ ] **Step 1: Add imports**

In `src/components/reports-table.tsx`, update the icon import from Task 4:

```tsx
import { Download, Eye, Trash2 } from "lucide-react";
```

Add the AlertDialog import alongside the other `@/components/ui/*` imports:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

- [ ] **Step 2: Add delete state and handler**

In `src/components/reports-table.tsx`, inside `ReportsTable()`, right after the existing `const [loading, setLoading] = useState(false);` line, add:

```tsx
  const [deletingId, setDeletingId] = useState<string | null>(null);
```

Right after the existing `handleDownload` function, add:

```tsx
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Gagal menghapus laporan" }));
        toast.error(body.error ?? "Gagal menghapus laporan");
        return;
      }
      setData((current) =>
        current
          ? {
              ...current,
              reports: current.reports.filter((report) => report.id !== id),
              total: current.total - 1,
            }
          : current,
      );
      toast.success("Laporan berhasil dihapus");
    } finally {
      setDeletingId(null);
    }
  }
```

- [ ] **Step 3: Add the delete icon button to the Aksi cell**

In the "Aksi" `<TableCell>` (edited in Task 4), add a third icon button after the Download `<Tooltip>` block, still inside the same `<TableCell>`:

```tsx
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              aria-label="Hapus laporan"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Hapus</TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus laporan ini?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Laporan akan dihapus
                            permanen dari sistem.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={deletingId === report.id}
                            onClick={() => handleDelete(report.id)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `reports-table.tsx`.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/rekap` with at least one report row (create one at `/` if needed).
Expected: the "Aksi" column now shows three icon buttons — outline eye, default download, red/destructive trash. Hovering the trash icon shows a "Hapus" tooltip. Clicking it opens a confirmation dialog titled "Hapus laporan ini?" with Cancel/Delete actions. Clicking "Batal" closes the dialog with no change. Clicking "Hapus" removes the row from the table immediately (no page reload) and shows a green success toast ("Laporan berhasil dihapus"). Refresh the page to confirm the row stays gone (i.e. it was actually deleted server-side, not just removed from local state).

- [ ] **Step 6: Commit**

```bash
git add src/components/reports-table.tsx
git commit -m "feat: wire delete action with confirmation dialog"
```

---

### Task 8: Final production build check

**Files:** none (verification-only task).

**Interfaces:**
- Consumes: the combined output of Tasks 1–7.
- Produces: nothing — this is the final gate confirming the whole feature set builds cleanly together.

- [ ] **Step 1: Run a full production build**

Run: `npm run build`
Expected: build completes successfully with no TypeScript or lint errors, and no missing-module errors for `lucide-react` icons, `@/components/ui/alert-dialog`, or the new `[id]/route.ts` handler.

- [ ] **Step 2: Manual end-to-end smoke test**

Run: `npm run start` (after the build), open `http://localhost:3000/`.
Walk through: submit the report form → navigate via the red "Rekap Data" button → confirm the new row appears under the blue sticky header → click the eye icon (opens PDF) → click the download icon (downloads merged PDF) → click the trash icon, confirm deletion, confirm the row disappears and the footer is visible at the bottom of the page throughout.
Expected: every step above works with no console errors (check via browser DevTools console).

- [ ] **Step 3: No commit needed**

This task only verifies; if it uncovers a problem, fix it in the relevant task's file and amend that task's commit process (create a small follow-up commit describing the fix) rather than leaving it uncommitted.
