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
  date: z.coerce.date({ error: "Tanggal wajib diisi" }),
  line: z.enum([...LINE_VALUES], { error: "Line wajib dipilih" }),
  machine: z
    .string({ error: "Nama mesin wajib diisi" })
    .trim()
    .min(1, "Nama mesin wajib diisi")
    .max(100, "Nama mesin maksimal 100 karakter"),
  problem: z
    .string({ error: "Problem wajib diisi" })
    .trim()
    .min(1, "Problem wajib diisi")
    .max(2000, "Problem maksimal 2000 karakter"),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;
