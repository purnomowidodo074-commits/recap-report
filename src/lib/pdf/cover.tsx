import path from "path";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { lineLabel } from "@/lib/validations/report";

const logoPath = path.join(process.cwd(), "public", "logo.png");

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
  },
  logo: {
    width: 56,
    height: 34,
    objectFit: "contain",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  stripeRed600: {
    height: 3,
    backgroundColor: "#DC2626",
  },
  stripeRed800: {
    height: 3,
    backgroundColor: "#991B1B",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  cellLabel: {
    width: 140,
    padding: 8,
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    color: "#374151",
    fontWeight: 700,
  },
  cellValue: {
    flex: 1,
    padding: 8,
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
        <View style={styles.headerRow}>
          <Image src={logoPath} style={styles.logo} />
          <Text style={styles.headerTitle}>
            Sistem Management{"\n"}5 Way Report
          </Text>
        </View>
        <View style={styles.stripeRed600} />
        <View style={styles.stripeRed800} />

        <Text style={[styles.title, { marginBottom: 20 }]}>5 Way Report</Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.cellLabel}>Tanggal</Text>
            <Text style={styles.cellValue}>{formatDate(date)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellLabel}>Line</Text>
            <Text style={styles.cellValue}>{lineLabel(line)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellLabel}>Nama Mesin</Text>
            <Text style={styles.cellValue}>{machine}</Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.cellLabel}>Problem</Text>
            <Text style={styles.cellValue}>{problem}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
