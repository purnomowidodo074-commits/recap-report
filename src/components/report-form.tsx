"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, FileText, UploadCloud, X } from "lucide-react";
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    // Cast needed: reportFormSchema uses z.coerce.date(), so under Zod v4 +
    // @hookform/resolvers v5 the resolver's inferred TFieldValues is the
    // schema's *input* type (`date: unknown`), not its output type
    // (`date: Date`). At runtime this field is always a real Date (seeded by
    // `emptyValues` and produced by Calendar's onSelect), so this cast
    // reflects the true shape without changing any behavior.
    resolver: zodResolver(reportFormSchema) as Resolver<ReportFormValues>,
    defaultValues: emptyValues,
  });

  function validateAndSetFile(selected: File | null) {
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    validateAndSetFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSetFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleRemoveFile() {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
              <label className="text-sm font-medium leading-none">
                Upload File 5W (PDF) <span className="text-destructive">*</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="sr-only"
              />

              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-input bg-muted/40 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-6 w-6 shrink-0 text-green-600" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={handleRemoveFile}
                    aria-label="Hapus file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
                    isDragging
                      ? "border-green-600 bg-green-600/5"
                      : "border-input hover:border-green-600/50 hover:bg-muted/40",
                    fileError && "border-destructive",
                  )}
                >
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Click to upload or drag files here
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, maksimal 10MB</p>
                </div>
              )}

              {fileError && <p className="text-sm font-medium text-destructive">{fileError}</p>}
            </div>

            <Button
              type="submit"
              disabled={submitting || !file}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {submitting ? "Menyimpan..." : "Simpan Laporan"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
