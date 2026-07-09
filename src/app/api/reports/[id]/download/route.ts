import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { buildMergedReportPdf } from "@/lib/pdf/merge";
import { lineLabel } from "@/lib/validations/report";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const report = await prisma.report.findUnique({ where: { id: (await params).id } });

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

  let mergedBytes: Buffer;
  try {
    mergedBytes = await buildMergedReportPdf(
      {
        date: report.date,
        line: report.line,
        machine: report.machine,
        problem: report.problem,
      },
      originalBytes,
    );
  } catch {
    return NextResponse.json(
      { error: "Gagal membuat PDF gabungan" },
      { status: 500 },
    );
  }

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
