import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMergedReportPdf } from "@/lib/pdf/merge";
import { lineLabel } from "@/lib/validations/report";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const report = await prisma.report.findUnique({ where: { id: (await params).id } });

  if (!report) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  let originalBytes: Buffer;
  try {
    const blobResponse = await fetch(report.filePath);
    if (!blobResponse.ok) {
      throw new Error("Blob fetch failed");
    }
    originalBytes = Buffer.from(await blobResponse.arrayBuffer());
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
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${fileName}"`,
    },
  });
}
