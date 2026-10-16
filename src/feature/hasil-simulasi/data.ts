import {
  type Icon,
  IconBatteryCharging2,
  IconBolt,
  IconEngine,
  IconSolarPanel,
} from "@tabler/icons-react";
import type { FieldPath } from "react-hook-form";
import type { RunStatus, ScenarioKey } from "@/repository/simulation/dto";
import type { SimulationFormValues } from "@/schemas/simulation/simulation.schema";
import type { SourceTone } from "@/shared/component/SourceBadge";

/*
 * Mengikuti desanyala_output_dashboard.html +
 * desanyala_output_variable_names.txt.
 */

type ScenarioMeta = {
  /** Nama di tab skenario & tabel (sama dengan referensi). */
  label: string;
  /** Nama pendek (label sumbu grafik). */
  shortLabel: string;
  color: string;
  swatchClass: string;
};

export const SCENARIO_META: Record<ScenarioKey, ScenarioMeta> = {
  diesel_only: {
    label: "Diesel-only",
    shortLabel: "Diesel",
    color: "var(--energy-diesel)",
    swatchClass: "bg-energy-diesel",
  },
  pv_diesel: {
    label: "PV + Diesel",
    shortLabel: "PV + Diesel",
    color: "var(--energy-pv)",
    swatchClass: "bg-energy-pv",
  },
  pv_diesel_battery: {
    label: "PV + Diesel + Baterai",
    shortLabel: "PV + D + Bat",
    color: "var(--brand-primary)",
    swatchClass: "bg-brand",
  },
};

export const SCENARIO_ORDER: ScenarioKey[] = [
  "diesel_only",
  "pv_diesel",
  "pv_diesel_battery",
];

type StatusMeta = { label: string; tone: SourceTone };

/** Status solver per skenario. "feasible" belum tentu optimal. */
export const RUN_STATUS_META: Record<RunStatus, StatusMeta> = {
  optimal: { label: "Optimal", tone: "success" },
  feasible: { label: "Feasible", tone: "assumption" },
  infeasible: { label: "Infeasible", tone: "danger" },
  error: { label: "Error", tone: "danger" },
  not_implemented: { label: "Belum didukung", tone: "danger" },
  queued: { label: "Antre", tone: "neutral" },
  running: { label: "Berjalan", tone: "neutral" },
};

/* ------------------------------------------------------------------------ */
/* Kapasitas terpilih (capacityGrid)                                        */
/* ------------------------------------------------------------------------ */

export type CapacityKey =
  | "pv_kwp"
  | "battery_kwh"
  | "battery_power_kw"
  | "genset_kw";

export const CAPACITY_META: Record<
  CapacityKey,
  { label: string; unit: string; icon: Icon; iconClass: string }
> = {
  pv_kwp: {
    label: "PV",
    unit: "kWp",
    icon: IconSolarPanel,
    iconClass: "text-energy-pv-ink",
  },
  battery_kwh: {
    label: "Baterai",
    unit: "kWh",
    icon: IconBatteryCharging2,
    iconClass: "text-energy-battery",
  },
  battery_power_kw: {
    label: "Daya baterai",
    unit: "kW",
    icon: IconBolt,
    iconClass: "text-energy-battery",
  },
  genset_kw: {
    label: "Genset",
    unit: "kW",
    icon: IconEngine,
    iconClass: "text-energy-diesel",
  },
};

export const CAPACITY_ORDER: CapacityKey[] = [
  "pv_kwp",
  "battery_kwh",
  "battery_power_kw",
  "genset_kw",
];

export const GENSET_BASIS_LABEL = {
  aggregate: "total semua unit",
  per_unit: "per unit",
  unknown: "basis kapasitas belum diketahui",
} as const;

/* ------------------------------------------------------------------------ */
/* Operasi energi (mainChart)                                               */
/* ------------------------------------------------------------------------ */

export const TIME_MODES = [
  { value: "year", label: "Ringkasan harian" },
  { value: "detail", label: "Detail 4 hari pertama" },
] as const;

export type TimeMode = (typeof TIME_MODES)[number]["value"];

export const CHART_MODES = [
  { value: "power", label: "Profil energi" },
  { value: "storage", label: "Operasi baterai" },
] as const;

export type ChartMode = (typeof CHART_MODES)[number]["value"];

/** Jumlah interval pada tampilan detail (4 hari × 24 jam). */
export const DETAIL_INTERVALS = 96;

/** Seri pasokan (ditumpuk) + pengisian baterai (di bawah nol). */
export const SUPPLY_SERIES = [
  {
    key: "genset",
    label: "Genset",
    color: "var(--energy-diesel)",
    swatchClass: "bg-energy-diesel",
  },
  {
    key: "pv",
    label: "PV",
    color: "var(--energy-pv)",
    swatchClass: "bg-energy-pv",
  },
  {
    key: "discharge",
    label: "Baterai keluar",
    color: "var(--energy-battery)",
    swatchClass: "bg-energy-battery",
  },
  {
    key: "charge",
    label: "Pengisian baterai",
    color: "var(--energy-battery-charge)",
    swatchClass: "bg-energy-battery-charge",
  },
] as const;

export const DEMAND_SERIES = {
  key: "demand",
  label: "Kebutuhan",
  color: "var(--energy-load)",
  swatchClass: "bg-energy-load",
} as const;

export const SOC_SERIES = {
  key: "soc",
  label: "SOC baterai (%)",
  color: "var(--brand-primary)",
  swatchClass: "bg-brand",
} as const;

export const UNMET_SERIES = {
  key: "unmet",
  label: "Tak terpenuhi",
  color: "var(--energy-unserved)",
  swatchClass: "bg-energy-unserved",
} as const;

export const RESULT_DISCLAIMER =
  "Hasil ini estimasi model berdasarkan asumsi skenario. Implementasi tetap butuh studi kelayakan lapangan, audit teknik, dan desain proteksi.";

/* ------------------------------------------------------------------------ */
/* Diagnosis infeasible (dugaan FE, bukan keluaran solver)                  */
/* ------------------------------------------------------------------------ */

export type InputField = FieldPath<SimulationFormValues>;

export type ConflictIssue = {
  /** Field form input untuk tombol "Ubah di input". */
  field: InputField;
  /** Judul card input tempat field berada. */
  section: string;
  label: string;
  /** high = "Kemungkinan besar", check = "Perlu dicek". */
  likelihood: "high" | "check";
  /** Nilai saat run, sudah diformat. */
  current_value: string;
  explanation: string;
  suggestion: string;
};

type LikelihoodMeta = {
  label: string;
  tone: SourceTone;
  rankClass: string;
};

export const LIKELIHOOD_META: Record<
  ConflictIssue["likelihood"],
  LikelihoodMeta
> = {
  high: {
    label: "Kemungkinan besar",
    tone: "danger",
    rankClass: "bg-danger text-fg-inverse",
  },
  check: {
    label: "Perlu dicek",
    tone: "assumption",
    rankClass: "bg-track text-fg-secondary",
  },
};

export const INPUT_SECTION = {
  demand: "2. Kebutuhan listrik",
  pv: "3. Panel surya (PV)",
  generators: "4. Generator diesel",
  battery: "5. Baterai",
  reliability: "7. Keandalan & optimasi",
} as const;
