/**
 * Batas atas sumbu Y yang "bulat" + interval yang rapi.
 * niceAxis(77.9) -> { top: 80, step: 20, ticks: [0, 20, 40, 60, 80] }
 */
export const niceAxis = (max: number, intervals = 4) => {
  const raw = Math.max(max, 1) / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 4, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ??
    raw;
  const top = Math.ceil(max / step) * step || step;
  const ticks = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  );
  return { top, step, ticks };
};

/** "03:00" dari jam ke-3. */
export const formatHour = (hour: number) =>
  `${String(hour).padStart(2, "0")}:00`;
