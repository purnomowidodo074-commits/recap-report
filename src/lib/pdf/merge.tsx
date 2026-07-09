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
