import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { lineLabel } from "@/lib/validations/report";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
  },
  label: {
    width: 140,
    color: "#6B7280",
  },
  value: {
    flex: 1,
  },
  problemBlock: {
    marginTop: 16,
  },
  problemLabel: {
    color: "#6B7280",
    marginBottom: 4,
  },
});

export interface ReportCoverData {
  date: Date;
  line: string;
  machine: string;
  problem: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ReportCoverDocument({ date, line, machine, problem }: ReportCoverData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Laporan Masalah 5W</Text>
        <Text style={styles.subtitle}>Dokumen ini dibuat otomatis sebagai cover laporan</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Tanggal</Text>
          <Text style={styles.value}>{formatDate(date)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Line</Text>
          <Text style={styles.value}>{lineLabel(line)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Mesin</Text>
          <Text style={styles.value}>{machine}</Text>
        </View>

        <View style={styles.problemBlock}>
          <Text style={styles.problemLabel}>Problem</Text>
          <Text style={styles.value}>{problem}</Text>
        </View>
      </Page>
    </Document>
  );
}
