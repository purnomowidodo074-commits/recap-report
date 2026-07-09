# PDF Collector (5W Laporan) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js app described in `prd.md` and `docs/superpowers/specs/2026-07-09-pdf-collector-design.md` — a form to upload 5W PDF reports, a filterable/paginated recap table, and a per-row download that merges a generated cover page with the original PDF.

**Architecture:** Next.js 14+ App Router (TypeScript) fullstack app. Route Handlers under `src/app/api/*` talk to PostgreSQL (Neon) via Prisma. Files are stored on local disk in `public/uploads/`. UI is built with Tailwind + Shadcn UI, react-hook-form + Zod for validation. Download generates a cover PDF with `@react-pdf/renderer` and merges it with the original file using `pdf-lib`, streamed back with no server-side caching.

**Tech Stack:** Next.js 14+, TypeScript, Prisma, PostgreSQL (Neon), Tailwind CSS, Shadcn UI, Zod, react-hook-form, @react-pdf/renderer, pdf-lib, sonner.

## Global Constraints

- Framework: Next.js 14+, App Router, TypeScript, `src/` directory, import alias `@/*`.
- Database: PostgreSQL hosted on Neon, connected via `DATABASE_URL` env var, accessed through Prisma.
- File storage: local `public/uploads/`, filenames randomized with `crypto.randomUUID()`, original name and relative path stored in DB — never trust the uploaded filename for the stored path.
- UI: Tailwind CSS + Shadcn UI components only (no other component library).
- PDF cover: `@react-pdf/renderer`. Merge with original: `pdf-lib`. No headless browser (Puppeteer/Playwright) involved.
- Validation: one Zod schema (`src/lib/validations/report.ts`) used by both the client form and the API route — do not duplicate validation rules.
- Max upload size: 10MB, enforced both client-side and server-side. Server-side file type check must inspect the PDF magic bytes (`%PDF-`), not just the extension/MIME string.
- Pagination: 20 rows per page on the recap table.
- No authentication/login in this phase.
- No automated test suite in this phase (per approved spec) — every task ends with a manual verification step (curl command, `tsc --noEmit`, or a documented manual check against the running dev server) instead of a written test file.
- Each task ends with a local `git commit` (needed so the task reviewer can diff `BASE..HEAD` per task). Do not push, squash, amend, or rewrite history — the user reviews and pushes manually. Building directly on `master` is authorized for this project (fresh repo, no prior history).
- Test fixture note: the throwaway PDF created in Task 5's curl verification (`printf '%PDF-1.4\n%%EOF' > test.pdf`) has only a valid header and is sufficient for testing upload validation, but is NOT a structurally complete PDF. Task 11's download/merge verification must use a real, complete PDF file (any actual PDF on the tester's machine), not that fixture — `pdf-lib`'s `PDFDocument.load` requires a parseable document.

---

## File Structure Overview

```
prisma/schema.prisma              # Report model + Line enum
src/lib/prisma.ts                 # Prisma client singleton
src/lib/validations/report.ts     # Zod schema, Line options/labels, size limit
src/lib/storage.ts                # PDF save + magic-byte validation
src/lib/pdf/cover.tsx             # react-pdf cover Document component
src/lib/pdf/merge.tsx             # pdf-lib merge (cover + original)
src/app/layout.tsx                # Root layout, font, Toaster, header
src/components/site-header.tsx    # Nav header (Form / Rekap links)
src/app/page.tsx                  # "/" — form page
src/components/report-form.tsx    # Client form component
src/app/rekap/page.tsx            # "/rekap" — recap page
src/components/reports-table.tsx  # Client table + filters + pagination
src/hooks/use-debounced-value.ts  # Debounce hook for filter inputs
src/app/api/reports/route.ts      # POST create, GET list+filter+paginate
src/app/api/reports/[id]/download/route.ts  # GET merged PDF download
src/components/ui/*               # Shadcn-generated primitives
```

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: entire Next.js scaffold (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `eslint.config.mjs`)

Note: `create-next-app` currently scaffolds Tailwind v4, which has no `tailwind.config.ts` — Tailwind is configured via `@import "tailwindcss"` and `@theme` in `globals.css` instead. Do not add a `tailwind.config.ts`.

**Interfaces:**
- Produces: a runnable Next.js dev server on `http://localhost:3000`, `src/` directory with `@/*` import alias, Tailwind configured.

- [ ] **Step 1: Run create-next-app in the current directory**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

If prompted about the directory not being empty, confirm — it only contains `prd.md`, `docs/`, and `.git`, none of which conflict.

- [ ] **Step 2: Verify the dev server starts**

Run: `npm run dev` (in a separate terminal, then stop it with Ctrl+C once confirmed)
Expected: server starts on port 3000 with no errors, default Next.js welcome page compiles.

- [ ] **Step 3: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project"
```

---

### Task 2: Install feature dependencies and initialize Shadcn UI

**Files:**
- Modify: `package.json` (new dependencies)
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx`, `src/components/ui/calendar.tsx`, `src/components/ui/popover.tsx`, `src/components/ui/table.tsx`, `src/components/ui/card.tsx`, `src/components/ui/label.tsx`, `src/components/ui/form.tsx`, `src/components/ui/sonner.tsx`, `src/components/ui/tooltip.tsx`

**Interfaces:**
- Consumes: Task 1's Next.js/Tailwind scaffold.
- Produces: `cn()` helper from `@/lib/utils`, all Shadcn primitives listed above importable from `@/components/ui/*`.

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install @prisma/client zod react-hook-form @hookform/resolvers @react-pdf/renderer pdf-lib date-fns sonner lucide-react
```

- [ ] **Step 2: Install Prisma CLI as a dev dependency**

```bash
npm install -D prisma
```

- [ ] **Step 3: Initialize Shadcn UI with defaults**

```bash
npx shadcn@latest init -d
```

- [ ] **Step 4: Add the required Shadcn components**

```bash
npx shadcn@latest add button input textarea select calendar popover table card label form sonner tooltip
```

- [ ] **Step 5: Verify type checking and build still pass**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds (default page still present from Task 1).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: install dependencies and init Shadcn UI"
```

---

### Task 3: Set up Prisma schema and connect to Neon

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `.env` (add `DATABASE_URL`)
- Create: `.env.example`

**Interfaces:**
- Produces: `Report` model and `Line` enum available via `@prisma/client` after `prisma generate`; a `reports` table created in the Neon database after `prisma migrate dev`.

- [ ] **Step 1: Initialize Prisma with the postgresql provider**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Get a Neon connection string and set it in `.env`**

Create a free project at Neon (https://neon.tech) if you don't already have one, copy the pooled connection string, and set it in `.env`:

```
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
```

- [ ] **Step 3: Write the Prisma schema**

Replace the contents of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Report {
  id        String   @id @default(cuid())
  date      DateTime
  line      Line
  machine   String
  problem   String
  fileName  String
  filePath  String
  fileSize  Int
  createdAt DateTime @default(now())
}

enum Line {
  MEL_POUR_ANALYS
  MOULD_RCS
  CORE_MAKING
  FINISHING
  MAINTENANCE
  DIE_PRESS
}
```

- [ ] **Step 4: Run the initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: migration applies successfully, `reports` table exists in Neon, `@prisma/client` types are generated.

- [ ] **Step 5: Verify the connection with Prisma Studio**

Run: `npx prisma studio` (opens a browser UI, then close it)
Expected: `Report` model is visible with 0 rows, no connection errors.

- [ ] **Step 6: Create `.env.example` documenting the required variable**

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

- [ ] **Step 7: Confirm `.env` is gitignored**

Check `.gitignore` includes `.env` (create-next-app adds this by default). If missing, add it.

- [ ] **Step 8: Commit**

```bash
git add prisma .env.example .gitignore
git commit -m "feat: add Prisma schema and Neon connection"
```

(`.env` itself must NOT be staged — it's gitignored and contains a secret.)

---

### Task 4: Shared validation, Prisma client singleton, and file storage utility

**Files:**
- Create: `src/lib/validations/report.ts`
- Create: `src/lib/prisma.ts`
- Create: `src/lib/storage.ts`

**Interfaces:**
- Consumes: `@prisma/client` types from Task 3 (`Line` enum values must match the schema exactly: `MEL_POUR_ANALYS`, `MOULD_RCS`, `CORE_MAKING`, `FINISHING`, `MAINTENANCE`, `DIE_PRESS`).
- Produces:
  - `LINE_VALUES: readonly string[]`, `LINE_OPTIONS: { value: string; label: string }[]`, `lineLabel(value: string): string`, `MAX_FILE_SIZE_BYTES: number`, `reportFormSchema: ZodSchema`, `type ReportFormValues` — all from `@/lib/validations/report`.
  - `prisma: PrismaClient` singleton from `@/lib/prisma`.
  - `saveUploadedPdf(file: File): Promise<{ fileName: string; filePath: string; fileSize: number }>` and `isPdfBuffer(buffer: Buffer): boolean` from `@/lib/storage`. Later tasks (5, API routes) call `saveUploadedPdf`.

- [ ] **Step 1: Create the validation module**

`src/lib/validations/report.ts`:

```typescript
import { z } from "zod";

export const LINE_VALUES = [
  "MEL_POUR_ANALYS",
  "MOULD_RCS",
  "CORE_MAKING",
  "FINISHING",
  "MAINTENANCE",
  "DIE_PRESS",
] as const;

export const LINE_LABELS: Record<(typeof LINE_VALUES)[number], string> = {
  MEL_POUR_ANALYS: "Mel-Pour-Analys",
  MOULD_RCS: "Mould-RCS",
  CORE_MAKING: "Core Making",
  FINISHING: "Finishing",
  MAINTENANCE: "Maintenance",
  DIE_PRESS: "Die Press",
};

export const LINE_OPTIONS = LINE_VALUES.map((value) => ({
  value,
  label: LINE_LABELS[value],
}));

export function lineLabel(value: string): string {
  return LINE_LABELS[value as (typeof LINE_VALUES)[number]] ?? value;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const reportFormSchema = z.object({
  date: z.coerce.date({ required_error: "Tanggal wajib diisi" }),
  line: z.enum([...LINE_VALUES], { required_error: "Line wajib dipilih" }),
  machine: z
    .string({ required_error: "Nama mesin wajib diisi" })
    .trim()
    .min(1, "Nama mesin wajib diisi")
    .max(100, "Nama mesin maksimal 100 karakter"),
  problem: z
    .string({ required_error: "Problem wajib diisi" })
    .trim()
    .min(1, "Problem wajib diisi")
    .max(2000, "Problem maksimal 2000 karakter"),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;
```

- [ ] **Step 2: Create the Prisma client singleton**

`src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Create the file storage utility**

`src/lib/storage.ts`:

```typescript
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const PDF_MAGIC_BYTES = Buffer.from("%PDF-");

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).equals(PDF_MAGIC_BYTES);
}

export async function saveUploadedPdf(file: File): Promise<{
  fileName: string;
  filePath: string;
  fileSize: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!isPdfBuffer(buffer)) {
    throw new Error("File yang diunggah bukan PDF yang valid");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const storedName = `${randomUUID()}.pdf`;
  const destination = path.join(UPLOAD_DIR, storedName);
  await writeFile(destination, buffer);

  return {
    fileName: file.name,
    filePath: `uploads/${storedName}`,
    fileSize: buffer.byteLength,
  };
}
```

- [ ] **Step 4: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Note on verification**

`isPdfBuffer` and `saveUploadedPdf` have no standalone runtime check in this task — they're exercised end-to-end by the `POST /api/reports` curl test in Task 5 (Step 3), which is the first point they're wired into a running request.

- [ ] **Step 6: Commit**

```bash
git add src/lib/validations/report.ts src/lib/prisma.ts src/lib/storage.ts
git commit -m "feat: add validation schema, Prisma client, and file storage utility"
```

---

### Task 5: `POST /api/reports` — create a report

**Files:**
- Create: `src/app/api/reports/route.ts` (POST handler; GET handler added in Task 6 in the same file)

**Interfaces:**
- Consumes: `reportFormSchema`, `MAX_FILE_SIZE_BYTES` from `@/lib/validations/report`; `saveUploadedPdf` from `@/lib/storage`; `prisma` from `@/lib/prisma`.
- Produces: `POST /api/reports` accepting `multipart/form-data` with fields `date`, `line`, `machine`, `problem`, `file`; returns `201 { report: Report }` on success or `4xx { error: string }` on failure. Consumed by `report-form.tsx` in Task 7.

- [ ] **Step 1: Write the route handler**

`src/app/api/reports/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_FILE_SIZE_BYTES, reportFormSchema } from "@/lib/validations/report";
import { saveUploadedPdf } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const parsed = reportFormSchema.safeParse({
    date: formData.get("date"),
    line: formData.get("line"),
    machine: formData.get("machine"),
    problem: formData.get("problem"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File PDF wajib diunggah" }, { status: 400 });
  }

  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) {
    return NextResponse.json({ error: "File harus berformat PDF" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 });
  }

  let saved;
  try {
    saved = await saveUploadedPdf(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menyimpan file" },
      { status: 400 },
    );
  }

  const report = await prisma.report.create({
    data: {
      date: parsed.data.date,
      line: parsed.data.line,
      machine: parsed.data.machine,
      problem: parsed.data.problem,
      fileName: saved.fileName,
      filePath: saved.filePath,
      fileSize: saved.fileSize,
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}
```

- [ ] **Step 2: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify with curl**

Start the dev server in a separate terminal: `npm run dev`. Create a tiny valid PDF fixture and POST it:

```bash
printf '%%PDF-1.4\n%%%%EOF' > /tmp/test.pdf
curl -s -X POST http://localhost:3000/api/reports \
  -F "date=2026-07-09" \
  -F "line=CORE_MAKING" \
  -F "machine=Mesin Core #1" \
  -F "problem=Uji coba" \
  -F "file=@/tmp/test.pdf;type=application/pdf"
```

Expected: HTTP 201 with a JSON body containing `report.id`, and a new file appears under `public/uploads/`.

Also verify rejection cases:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/reports \
  -F "date=2026-07-09" -F "line=CORE_MAKING" -F "machine=X" -F "problem=Y"
```

Expected: `400` (missing file).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/reports/route.ts
git commit -m "feat: add POST /api/reports to create a report"
```

---

### Task 6: `GET /api/reports` — list, filter, paginate

**Files:**
- Modify: `src/app/api/reports/route.ts` (add GET handler alongside POST from Task 5)

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`.
- Produces: `GET /api/reports?line=&machine=&q=&page=` returning `200 { reports: Report[], total: number, page: number, pageSize: number, totalPages: number }`. Consumed by `reports-table.tsx` in Task 9.

- [ ] **Step 1: Add the GET handler**

Append to `src/app/api/reports/route.ts` (below the existing `POST` export):

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const line = searchParams.get("line");
  const machine = searchParams.get("machine");
  const q = searchParams.get("q");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = 20;

  const where = {
    ...(line ? { line: line as never } : {}),
    ...(machine ? { machine: { contains: machine, mode: "insensitive" as const } } : {}),
    ...(q ? { problem: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);

  return NextResponse.json({
    reports,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
```

- [ ] **Step 2: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify with curl**

With the dev server running and at least one report created (Task 5's step 3):

```bash
curl -s "http://localhost:3000/api/reports?page=1" | head -c 500
curl -s "http://localhost:3000/api/reports?line=CORE_MAKING" | head -c 500
curl -s "http://localhost:3000/api/reports?q=Uji" | head -c 500
curl -s "http://localhost:3000/api/reports?machine=nonexistent" | head -c 500
```

Expected: first three calls return the report created earlier inside `reports`; the last returns `"reports":[]` with `"total":0`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/reports/route.ts
git commit -m "feat: add GET /api/reports list, filter, and pagination"
```

---

### Task 7: Report form page (`/`)

**Files:**
- Create: `src/components/report-form.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `LINE_OPTIONS`, `reportFormSchema`, `ReportFormValues` from `@/lib/validations/report`; Shadcn components from `@/components/ui/*`; `POST /api/reports` from Task 5.
- Produces: `ReportForm` component rendered at `/`.

- [ ] **Step 1: Write the form component**

`src/components/report-form.tsx`:

```tsx
"use client";

import { useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  LINE_OPTIONS,
  MAX_FILE_SIZE_BYTES,
  reportFormSchema,
  type ReportFormValues,
} from "@/lib/validations/report";

const emptyValues = {
  date: new Date(),
  line: undefined as unknown as ReportFormValues["line"],
  machine: "",
  problem: "",
};

export function ReportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: emptyValues,
  });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFileError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    const looksLikePdf =
      selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");
    if (!looksLikePdf) {
      setFileError("File harus berformat PDF");
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileError("Ukuran file maksimal 10MB");
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function onSubmit(values: ReportFormValues) {
    if (!file) {
      setFileError("File PDF wajib diunggah");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.set("date", values.date.toISOString());
    formData.set("line", values.line);
    formData.set("machine", values.machine);
    formData.set("problem", values.problem);
    formData.set("file", file);

    try {
      const response = await fetch("/api/reports", { method: "POST", body: formData });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Gagal menyimpan laporan");
      }

      toast.success("Laporan berhasil disimpan");
      form.reset(emptyValues);
      setFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan laporan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Form Laporan 5W</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "dd MMMM yyyy") : "Pilih tanggal"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => date && field.onChange(date)}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="line"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Line</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih line produksi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LINE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="machine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Mesin</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Mesin Core #3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="problem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Deskripsikan masalah yang terjadi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Upload File 5W (PDF)</label>
              <Input type="file" accept="application/pdf" onChange={handleFileChange} />
              {fileError && <p className="text-sm font-medium text-destructive">{fileError}</p>}
              {file && !fileError && (
                <p className="text-sm text-muted-foreground">{file.name}</p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Menyimpan..." : "Simpan Laporan"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Wire it into the home page**

Replace the contents of `src/app/page.tsx`:

```tsx
import { ReportForm } from "@/components/report-form";

export default function HomePage() {
  return <ReportForm />;
}
```

- [ ] **Step 3: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: form renders with all fields; picking a date, line, typing machine/problem, and selecting a PDF file then clicking "Simpan Laporan" shows a success toast and resets the form. Submitting without a file shows the "File PDF wajib diunggah" error. Selecting a non-PDF file shows the file-type error.

- [ ] **Step 5: Commit**

```bash
git add src/components/report-form.tsx src/app/page.tsx
git commit -m "feat: add report form page"
```

---

### Task 8: Root layout and site header

**Files:**
- Create: `src/components/site-header.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `SiteHeader` component with nav links to `/` and `/rekap`; root layout renders it plus the Shadcn `Toaster` on every page.

- [ ] **Step 1: Write the header component**

`src/components/site-header.tsx`:

```tsx
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
```

- [ ] **Step 2: Update the root layout**

Replace the contents of `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rekap Laporan 5W",
  description: "Sistem manajemen dan rekap laporan PDF 5W",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: header with "Form Laporan" / "Rekap Data" links appears above the form on every page; clicking "Rekap Data" navigates to `/rekap` (404 is fine — that page comes in Task 9).

- [ ] **Step 5: Commit**

```bash
git add src/components/site-header.tsx src/app/layout.tsx
git commit -m "feat: add site header and wire into root layout"
```

---

### Task 9: Reports table with filters and pagination (`/rekap`)

**Files:**
- Create: `src/hooks/use-debounced-value.ts`
- Create: `src/components/reports-table.tsx`
- Create: `src/app/rekap/page.tsx`

**Interfaces:**
- Consumes: `LINE_OPTIONS`, `lineLabel` from `@/lib/validations/report`; `GET /api/reports` from Task 6; Shadcn `Table`, `Select`, `Input`, `Button`, `Tooltip` components.
- Produces: `ReportsTable` component rendered at `/rekap`. Its "Download" button calls `GET /api/reports/:id/download` (built in Task 11) — until Task 11 exists, this button will 404, which is expected at this point in the plan.
- `useDebouncedValue<T>(value: T, delayMs: number): T` from `@/hooks/use-debounced-value`.

- [ ] **Step 1: Write the debounce hook**

`src/hooks/use-debounced-value.ts`:

```typescript
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
```

- [ ] **Step 2: Write the table component**

`src/components/reports-table.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { LINE_OPTIONS, lineLabel } from "@/lib/validations/report";

interface ReportRow {
  id: string;
  date: string;
  line: string;
  machine: string;
  problem: string;
  filePath: string;
}

interface ReportsResponse {
  reports: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function ReportsTable() {
  const [line, setLine] = useState<string>("all");
  const [machine, setMachine] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const debouncedMachine = useDebouncedValue(machine, 300);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    setPage(1);
  }, [line, debouncedMachine, debouncedQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (line !== "all") params.set("line", line);
    if (debouncedMachine) params.set("machine", debouncedMachine);
    if (debouncedQuery) params.set("q", debouncedQuery);
    params.set("page", String(page));

    setLoading(true);
    fetch(`/api/reports?${params.toString()}`)
      .then((response) => response.json())
      .then((body: ReportsResponse) => setData(body))
      .catch(() => toast.error("Gagal memuat data laporan"))
      .finally(() => setLoading(false));
  }, [line, debouncedMachine, debouncedQuery, page]);

  async function handleDownload(id: string) {
    const response = await fetch(`/api/reports/${id}/download`);

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Gagal mengunduh laporan" }));
      toast.error(body.error ?? "Gagal mengunduh laporan");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="(.+)"/);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = match?.[1] ?? "laporan.pdf";
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari problem..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Cari nama mesin..."
          value={machine}
          onChange={(event) => setMachine(event.target.value)}
          className="max-w-xs"
        />
        <Select value={line} onValueChange={setLine}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Line" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Line</SelectItem>
            {LINE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Memuat...
              </TableCell>
            </TableRow>
          )}
          {!loading && data?.reports.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Belum ada laporan
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            data?.reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{formatDate(report.date)}</TableCell>
                <TableCell>{lineLabel(report.line)}</TableCell>
                <TableCell>{report.machine}</TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{truncate(report.problem)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">{report.problem}</TooltipContent>
                  </Tooltip>
                </TableCell>
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
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {data.page} dari {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire it into the rekap page**

`src/app/rekap/page.tsx`:

```tsx
import { ReportsTable } from "@/components/reports-table";

export default function RekapPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Rekap Data Laporan</h1>
      <ReportsTable />
    </div>
  );
}
```

- [ ] **Step 4: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/rekap`.
Expected: table shows the report(s) created in Task 5's curl test; typing in "Cari problem..." or "Cari nama mesin..." filters the table after a short debounce; selecting a Line in the dropdown filters correctly; "Lihat" opens the raw PDF in a new tab. "Download" will show an error toast — that's expected, it's wired up in Task 11.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/use-debounced-value.ts src/components/reports-table.tsx src/app/rekap/page.tsx
git commit -m "feat: add reports table with filters and pagination"
```

---

### Task 10: PDF cover component and merge utility

**Files:**
- Create: `src/lib/pdf/cover.tsx`
- Create: `src/lib/pdf/merge.tsx`

**Interfaces:**
- Consumes: `lineLabel` from `@/lib/validations/report`.
- Produces: `ReportCoverDocument(data: ReportCoverData): JSX.Element` and `interface ReportCoverData { date: Date; line: string; machine: string; problem: string }` from `@/lib/pdf/cover`; `buildMergedReportPdf(coverData: ReportCoverData, originalPdfBytes: Buffer): Promise<Buffer>` from `@/lib/pdf/merge`. Task 11 calls `buildMergedReportPdf`.

- [ ] **Step 1: Write the cover document component**

`src/lib/pdf/cover.tsx`:

```tsx
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { lineLabel } from "@/lib/validations/report";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
  },
  label: {
    width: 140,
    color: "#6B7280",
  },
  value: {
    flex: 1,
  },
  problemBlock: {
    marginTop: 16,
  },
  problemLabel: {
    color: "#6B7280",
    marginBottom: 4,
  },
});

export interface ReportCoverData {
  date: Date;
  line: string;
  machine: string;
  problem: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ReportCoverDocument({ date, line, machine, problem }: ReportCoverData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Laporan Masalah 5W</Text>
        <Text style={styles.subtitle}>Dokumen ini dibuat otomatis sebagai cover laporan</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Tanggal</Text>
          <Text style={styles.value}>{formatDate(date)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Line</Text>
          <Text style={styles.value}>{lineLabel(line)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Mesin</Text>
          <Text style={styles.value}>{machine}</Text>
        </View>

        <View style={styles.problemBlock}>
          <Text style={styles.problemLabel}>Problem</Text>
          <Text style={styles.value}>{problem}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Write the merge utility**

`src/lib/pdf/merge.tsx`:

```tsx
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import { ReportCoverDocument, type ReportCoverData } from "./cover";

export async function buildMergedReportPdf(
  coverData: ReportCoverData,
  originalPdfBytes: Buffer,
): Promise<Buffer> {
  const coverBuffer = await renderToBuffer(<ReportCoverDocument {...coverData} />);

  const mergedPdf = await PDFDocument.create();
  const coverDoc = await PDFDocument.load(coverBuffer);
  const originalDoc = await PDFDocument.load(originalPdfBytes);

  const coverPages = await mergedPdf.copyPages(coverDoc, coverDoc.getPageIndices());
  coverPages.forEach((page) => mergedPdf.addPage(page));

  const originalPages = await mergedPdf.copyPages(originalDoc, originalDoc.getPageIndices());
  originalPages.forEach((page) => mergedPdf.addPage(page));

  const mergedBytes = await mergedPdf.save();
  return Buffer.from(mergedBytes);
}
```

- [ ] **Step 3: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdf/cover.tsx src/lib/pdf/merge.tsx
git commit -m "feat: add PDF cover component and merge utility"
```

(This task has no standalone runtime check — `buildMergedReportPdf` is exercised end-to-end via the download route in Task 11.)

---

### Task 11: `GET /api/reports/:id/download` and wire up the Download button

**Files:**
- Create: `src/app/api/reports/[id]/download/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`; `buildMergedReportPdf` from `@/lib/pdf/merge`; `lineLabel` from `@/lib/validations/report`.
- Produces: `GET /api/reports/:id/download` returning `200` with `Content-Type: application/pdf` and `Content-Disposition: attachment` on success, `404 { error: string }` if the report or its file is missing. Consumed by `reports-table.tsx`'s `handleDownload` (already wired in Task 9).

- [ ] **Step 1: Write the download route**

`src/app/api/reports/[id]/download/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { buildMergedReportPdf } from "@/lib/pdf/merge";
import { lineLabel } from "@/lib/validations/report";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const report = await prisma.report.findUnique({ where: { id: params.id } });

  if (!report) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  const absolutePath = path.join(process.cwd(), "public", report.filePath);

  let originalBytes: Buffer;
  try {
    originalBytes = await readFile(absolutePath);
  } catch {
    return NextResponse.json(
      { error: "File PDF asli tidak ditemukan di server" },
      { status: 404 },
    );
  }

  const mergedBytes = await buildMergedReportPdf(
    {
      date: report.date,
      line: report.line,
      machine: report.machine,
      problem: report.problem,
    },
    originalBytes,
  );

  const dateSlug = report.date.toISOString().slice(0, 10);
  const fileName = `Laporan-${lineLabel(report.line)}-${dateSlug}.pdf`.replace(/\s+/g, "-");

  return new NextResponse(new Uint8Array(mergedBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
```

- [ ] **Step 2: Verify type checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify with curl**

Task 5's `printf`-generated fixture is not a complete parseable PDF (see Global Constraints) and will make `buildMergedReportPdf` throw. Create a report with a real, complete PDF first:

```bash
curl -s -X POST http://localhost:3000/api/reports \
  -F "date=2026-07-09" \
  -F "line=CORE_MAKING" \
  -F "machine=Mesin Core #2" \
  -F "problem=Uji coba download" \
  -F "file=@<PATH_TO_ANY_REAL_PDF_ON_YOUR_MACHINE>;type=application/pdf"
```

Note the `report.id` from the response, then:

```bash
curl -s -o /tmp/merged.pdf -D - "http://localhost:3000/api/reports/<REPORT_ID>/download"
```

Expected: response headers include `content-type: application/pdf` and `content-disposition: attachment; filename="..."`; `/tmp/merged.pdf` opens as a valid PDF with the cover page first (Tanggal/Line/Nama Mesin/Problem) followed by the original file's pages.

Also verify the 404 case:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/reports/does-not-exist/download"
```

Expected: `404`.

- [ ] **Step 4: Manually verify the Download button in the browser**

Open `http://localhost:3000/rekap`, click "Download" on a row.
Expected: browser downloads a PDF file; opening it shows the cover page followed by the original 5W PDF content.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/reports/[id]/download/route.ts"
git commit -m "feat: add merged PDF download route"
```

---

### Task 12: Storage gitignore and setup documentation

**Files:**
- Modify: `.gitignore` (ignore uploaded PDFs, keep the directory tracked)
- Create: `public/uploads/.gitkeep`
- Modify: `README.md` (setup instructions)

**Interfaces:**
- None — this task only affects repo hygiene and documentation, no runtime code.

- [ ] **Step 1: Ignore uploaded files but keep the directory**

Append to `.gitignore`:

```
# Uploaded report PDFs (local storage, not committed)
/public/uploads/*
!/public/uploads/.gitkeep
```

- [ ] **Step 2: Create the placeholder file**

Create empty file `public/uploads/.gitkeep` (so the directory exists in a fresh checkout before any upload happens).

- [ ] **Step 3: Write setup instructions in the README**

Replace `README.md` with:

```markdown
# Rekap Laporan 5W

Sistem manajemen dan rekap laporan PDF 5W berdasarkan line produksi dan mesin.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Create a free PostgreSQL database at [Neon](https://neon.tech) and copy the
   connection string.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Neon connection
   string.
4. Run migrations:
   \`\`\`bash
   npx prisma migrate deploy
   \`\`\`
5. Start the dev server:
   \`\`\`bash
   npm run dev
   \`\`\`
6. Open `http://localhost:3000` to submit a report, and `http://localhost:3000/rekap`
   to browse, filter, and download reports.

Uploaded PDFs are stored locally under `public/uploads/` and are not committed
to git.
```

- [ ] **Step 4: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add .gitignore public/uploads/.gitkeep README.md
git commit -m "docs: add setup instructions and ignore uploaded files"
```

---

### Task 13: End-to-end manual verification pass

**Files:**
- None (verification only, no code changes expected — fix any bugs found in the relevant file from earlier tasks)

**Interfaces:**
- None.

- [ ] **Step 1: Full happy-path walkthrough**

With `npm run dev` running and a valid `DATABASE_URL` configured:

1. Open `http://localhost:3000`. Submit a report: pick today's date, select "Die Press", enter a machine name, enter a problem description, attach a real multi-page PDF. Confirm the success toast appears and the form resets.
2. Open `http://localhost:3000/rekap`. Confirm the new row appears with the correct Tanggal/Line/Nama Mesin/Problem.
3. Filter by typing part of the problem text into "Cari problem..." — confirm the row still shows. Clear it, filter by "Die Press" in the Line dropdown — confirm the row still shows. Filter by an unrelated machine name — confirm the table shows "Belum ada laporan".
4. Click "Lihat" on the row — confirm the original PDF opens in a new tab unmodified.
5. Click "Download" on the row — confirm a merged PDF downloads; open it and confirm page 1 is the generated cover with the correct Tanggal/Line/Nama Mesin/Problem, and subsequent pages match the originally uploaded PDF exactly.

- [ ] **Step 2: Edge-case walkthrough**

1. Try submitting the form with no file attached — confirm inline error, no request sent.
2. Try attaching a non-PDF file (e.g. a `.txt` renamed to `.pdf`, or an actual `.jpg`) — confirm client-side rejection; if bypassed, confirm the server rejects it with a 400 (test via curl with a non-PDF body, as in Task 5's verification).
3. Add a second and third report so the recap table has 3+ rows, confirm pagination controls only appear once more than 20 rows exist (create additional rows via curl if manually creating 21 is impractical) — at minimum confirm the "Halaman X dari Y" UI does not appear with fewer than 21 rows and would with more, by inspecting the `totalPages` logic in `reports-table.tsx`.

- [ ] **Step 3: Fix any issues found**

If any step above fails, fix the issue in the relevant file from Tasks 1–12, re-run `npx tsc --noEmit` and `npm run build`, and re-verify the specific failing step.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found in end-to-end verification"
```

Skip this step if no fixes were needed. Report completion to the user — do not push; the user pushes manually.
