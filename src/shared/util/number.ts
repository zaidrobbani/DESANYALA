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

/**
 * Rupiah ringkas: miliar dengan desimal, juta dibulatkan.
 * formatIdrCompact(11.9e9) -> { value: "11,9", unit: "miliar Rp" }
 * formatIdrCompact(456e6)  -> { value: "456", unit: "juta Rp" }
 */
export const formatIdrCompact = (value: number, billionDigits = 1) => {
  const abs = Math.abs(value);
  if (abs >= 1e9) {
    return {
      value: formatNumber(value / 1e9, billionDigits, billionDigits),
      unit: "miliar Rp",
    };
  }
  if (abs >= 1e6) {
    return { value: formatNumber(value / 1e6, 0), unit: "juta Rp" };
  }
  return { value: formatNumber(value, 0), unit: "Rp" };
};

/** "15,7 %" (spasi sebelum %, sesuai gaya penulisan di Figma). */
export const formatPercent = (value: number, fractionDigits = 1) =>
  `${formatNumber(value, fractionDigits, fractionDigits)} %`;
