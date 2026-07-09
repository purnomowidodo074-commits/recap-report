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
