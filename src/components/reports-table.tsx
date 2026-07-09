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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    <TooltipProvider>
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
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Memuat...
                </TableCell>
              </TableRow>
            )}
            {!loading && data?.reports?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada laporan
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data?.reports?.map((report) => (
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
        </div>

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
    </TooltipProvider>
  );
}
