import type { LoadProfileValidation } from "@/repository/simulation/dto";
import { parseIdNumber } from "@/shared/util/number";

export type ParsedLoadProfile = {
  validation: LoadProfileValidation;
  /** Rata-rata per jam (24 nilai) untuk pratinjau grafik. */
  hourlyAverageKw: number[] | null;
};

const VALID_ROW_COUNTS = [24, 8760];

const parseValue = (raw: string | undefined) => {
  if (raw === undefined || raw.trim() === "") return null;
  const trimmed = raw.trim();
  // Terima "12.5" (format CSV umum) maupun "12,5" (format Indonesia).
  const value = /^-?\d+(\.\d+)?$/.test(trimmed)
    ? Number(trimmed)
    : parseIdNumber(trimmed);
  return Number.isNaN(value) ? null : value;
};

/**
 * Validasi ringan file CSV profil beban di browser (kolom: timestamp, load_kW).
 * File .xlsx divalidasi oleh backend.
 */
export const parseLoadProfileCsv = async (
  file: File,
): Promise<ParsedLoadProfile> => {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const delimiter = lines[0]?.includes(";") ? ";" : ",";
  const header = (lines[0] ?? "")
    .split(delimiter)
    .map((cell) => cell.trim().toLowerCase());

  const loadIndex = header.findIndex((cell) => cell.startsWith("load"));
  const hasHeader = loadIndex !== -1;
  const columnIndex = hasHeader ? loadIndex : 1;
  const unitConsistent = hasHeader ? header[loadIndex] === "load_kw" : false;
  const rows = hasHeader ? lines.slice(1) : lines;

  let negativeCount = 0;
  let emptyCount = 0;
  const values: (number | null)[] = rows.map((row) => {
    const value = parseValue(row.split(delimiter)[columnIndex]);
    if (value === null) emptyCount += 1;
    else if (value < 0) negativeCount += 1;
    return value;
  });

  let hourlyAverageKw: number[] | null = null;
  if (VALID_ROW_COUNTS.includes(values.length)) {
    const sums = Array.from({ length: 24 }, () => 0);
    const counts = Array.from({ length: 24 }, () => 0);
    values.forEach((value, index) => {
      if (value === null || value < 0) return;
      sums[index % 24] += value;
      counts[index % 24] += 1;
    });
    hourlyAverageKw = sums.map((sum, hour) =>
      counts[hour] ? Math.round((sum / counts[hour]) * 100) / 100 : 0,
    );
  }

  return {
    validation: {
      rows: values.length,
      interval_minutes: 60,
      unit: "kW",
      unit_consistent: unitConsistent,
      negative_count: negativeCount,
      interpolated_count: emptyCount,
    },
    hourlyAverageKw,
  };
};

export const isValidRowCount = (rows: number) =>
  VALID_ROW_COUNTS.includes(rows);
