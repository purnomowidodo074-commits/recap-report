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
