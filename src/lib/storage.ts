import { randomUUID } from "crypto";
import { del, put } from "@vercel/blob";

const PDF_MAGIC_BYTES = Buffer.from("%PDF-");
const BLOB_STORE_ID = process.env.BLOB_STORE_ID_PUBLIC_STORE_ID;

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

  const storedName = `${randomUUID()}.pdf`;
  const blob = await put(`uploads/${storedName}`, buffer, {
    access: "public",
    contentType: "application/pdf",
    storeId: BLOB_STORE_ID,
  });

  return {
    fileName: file.name,
    filePath: blob.url,
    fileSize: buffer.byteLength,
  };
}

export async function deleteUploadedPdf(filePath: string): Promise<void> {
  await del(filePath, { storeId: BLOB_STORE_ID });
}
