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
