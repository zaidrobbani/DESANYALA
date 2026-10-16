const LOCALE = "id-ID";

/**
 * Format angka gaya Indonesia: ribuan pakai titik, desimal pakai koma.
 * formatNumber(17100) -> "17.100", formatNumber(0.28, 2) -> "0,28"
 */
export const formatNumber = (
  value: number,
  maximumFractionDigits = 2,
  minimumFractionDigits = 0,
) =>
  new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);

/**
 * Parse input angka gaya Indonesia ("17.100", "0,28", "5,73") ke number.
 * Mengembalikan NaN bila tidak valid.
 */
export const parseIdNumber = (raw: string): number => {
  const value = raw.trim().replace(/\s/g, "");
  if (value === "") return Number.NaN;
  if (!/^-?[\d.]*,?\d*$/.test(value)) return Number.NaN;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return normalized === "" || normalized === "-"
    ? Number.NaN
    : Number(normalized);
};

/** "00:09" dari detik. */
export const formatDuration = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

/** "15,7 %" (spasi sebelum %, sesuai gaya penulisan di Figma). */
export const formatPercent = (value: number, fractionDigits = 1) =>
  `${formatNumber(value, fractionDigits, fractionDigits)} %`;

/** Label sumbu ringkas: 1.500 -> "1,5 rb", 2.300.000 -> "2,3 jt". */
export const formatCompact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${formatNumber(value / 1e6, 1)} jt`;
  if (abs >= 1e4) return `${formatNumber(value / 1e3, 0)} rb`;
  return formatNumber(value);
};
