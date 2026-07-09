import { ReportsTable } from "@/components/reports-table";

export default function RekapPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Rekap Data Laporan</h1>
      <ReportsTable />
    </div>
  );
}
