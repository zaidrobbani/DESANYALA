const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Skalakan bentuk profil 24 jam agar totalnya = energi harian (kWh)
 * dan nilai maksimumnya = daya puncak (kW), memakai transformasi linear
 * v' = a·v + b. Bila hasilnya memunculkan nilai negatif (bentuk terlalu
 * "datar" untuk kombinasi energi/puncak tsb), fallback ke skala proporsional
 * terhadap energi harian saja.
 */
export const scaleLoadProfile = (
  shape: readonly number[],
  dailyEnergyKwh: number,
  peakLoadKw: number,
): number[] => {
  const hours = shape.length;
  const shapeMax = Math.max(...shape);
  const shapeSum = shape.reduce((acc, value) => acc + value, 0);
  const denominator = shapeMax * hours - shapeSum;

  if (denominator > 0) {
    const a = (peakLoadKw * hours - dailyEnergyKwh) / denominator;
    const b = peakLoadKw - a * shapeMax;
    const scaled = shape.map((value) => a * value + b);
    if (a > 0 && scaled.every((value) => value >= 0)) {
      return scaled.map(round2);
    }
  }

  const factor = shapeSum > 0 ? dailyEnergyKwh / shapeSum : 0;
  return shape.map((value) => round2(value * factor));
};

export const toHourlyChartData = (profileKw: readonly number[]) =>
  profileKw.map((load, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    load,
  }));
