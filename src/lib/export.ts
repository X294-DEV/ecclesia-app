import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

// Helper genérico de exportación (RF-09). Cada reporte arma un ExportTable
// y este archivo lo convierte a Excel o PDF; nadie más tiene que tocar exceljs ni jsPDF.

export type ExportValue = string | number | Date | null | undefined;

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => ExportValue;
  /** Ancho en caracteres para Excel (opcional). */
  width?: number;
  /** "money" formatea como MXN, "date" como dd/mm/aaaa. */
  format?: "money" | "date";
};

export type ExportTable<T> = {
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  /** Fila final opcional (p. ej. totales), una celda por columna. */
  footer?: ExportValue[];
};

export type ExportFormat = "xlsx" | "pdf";

export const EXPORT_MIME: Record<ExportFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const date = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

function asText(value: ExportValue, format?: ExportColumn<unknown>["format"]): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return date.format(value);
  if (format === "money" && typeof value === "number") return money.format(value);
  return String(value);
}

export async function toXlsx<T>(table: ExportTable<T>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ecclesia";
  const sheet = workbook.addWorksheet(table.title.slice(0, 31));

  sheet.addRow([table.title]).font = { bold: true, size: 14 };
  if (table.subtitle) sheet.addRow([table.subtitle]).font = { italic: true };
  sheet.addRow([]);

  const header = sheet.addRow(table.columns.map((column) => column.header));
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  });

  for (const row of table.rows) {
    sheet.addRow(table.columns.map((column) => column.value(row) ?? null));
  }
  if (table.footer) sheet.addRow(table.footer.map((value) => value ?? null)).font = { bold: true };

  table.columns.forEach((column, index) => {
    const excelColumn = sheet.getColumn(index + 1);
    excelColumn.width = column.width ?? Math.max(12, column.header.length + 2);
    if (column.format === "money") excelColumn.numFmt = '"$"#,##0.00';
    if (column.format === "date") excelColumn.numFmt = "dd/mm/yyyy";
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function toPdf<T>(table: ExportTable<T>): Buffer {
  const doc = new jsPDF({ orientation: table.columns.length > 5 ? "landscape" : "portrait" });

  doc.setFontSize(16);
  doc.text(table.title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(table.subtitle ?? `Generado el ${date.format(new Date())}`, 14, 25);

  autoTable(doc, {
    startY: 30,
    head: [table.columns.map((column) => column.header)],
    body: table.rows.map((row) => table.columns.map((column) => asText(column.value(row), column.format))),
    foot: table.footer ? [table.footer.map((value, i) => asText(value, table.columns[i]?.format))] : undefined,
    headStyles: { fillColor: [79, 70, 229] },
    footStyles: { fillColor: [229, 231, 235], textColor: 20 },
    styles: { fontSize: 9 },
  });

  return Buffer.from(doc.output("arraybuffer"));
}

export async function exportTable<T>(table: ExportTable<T>, format: ExportFormat): Promise<Buffer> {
  return format === "xlsx" ? toXlsx(table) : toPdf(table);
}
