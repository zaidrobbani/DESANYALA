import type { SimulationResult } from "@/repository/simulation/dto";

const escapeCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toLine = (cells: (string | number)[]) => cells.map(escapeCell).join(",");

/**
 * CSV hasil: blok ringkasan per skenario, baris kosong, lalu dispatch hari
 * tipikal. Angka mentah (titik desimal) agar mudah diolah ulang.
 */
export const buildResultCsv = (result: SimulationResult) => {
  const summary = [
    toLine([
      "skenario",
      "npc_idr",
      "lcoe_idr_per_kwh",
      "capex_idr",
      "opex_idr_per_year",
      "fuel_liters_per_year",
      "served_energy_kwh_per_year",
      "unserved_energy_pct",
      "solve_seconds",
    ]),
    ...result.scenarios.map((s) =>
      toLine([
        s.key,
        s.npc_idr,
        s.lcoe_idr_per_kwh,
        s.capex_idr,
        s.opex_idr_per_year,
        Math.round(s.fuel_liters_per_year),
        Math.round(s.served_energy_kwh_per_year),
        s.unserved_energy_pct,
        s.solve_seconds,
      ]),
    ),
  ];

  const dispatch = [
    toLine([
      "skenario",
      "jam",
      "beban_kw",
      "diesel_kw",
      "pv_kw",
      "baterai_discharge_kw",
      "baterai_charge_kw",
    ]),
    ...result.scenarios.flatMap((s) =>
      s.typical_day_dispatch.map((row) =>
        toLine([
          s.key,
          `${String(row.hour).padStart(2, "0")}:00`,
          row.load_kw,
          row.diesel_kw,
          row.pv_kw,
          row.battery_discharge_kw,
          row.battery_charge_kw,
        ]),
      ),
    ),
  ];

  return [...summary, "", ...dispatch].join("\n");
};

export const downloadTextFile = (
  content: string,
  fileName: string,
  type = "text/csv;charset=utf-8",
) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
