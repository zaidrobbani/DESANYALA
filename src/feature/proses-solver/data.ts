import type {
  ScenarioKey,
  ScenarioRunStatus,
  SolverLogLine,
} from "@/repository/simulation/dto";

/** Jeda sebelum otomatis pindah ke halaman Hasil setelah solver selesai. */
export const REDIRECT_DELAY_MS = 1500;

export const POLLING_INTERVAL_MS = 1000;

/** Warna label "Skenario A/B/C" mengikuti warna energi skenarionya. */
export const SCENARIO_CODE_CLASS: Record<ScenarioKey, string> = {
  diesel_only: "text-energy-diesel",
  pv_diesel: "text-energy-pv-ink",
  pv_diesel_battery: "text-brand",
};

export const SCENARIO_RUNNING_DESCRIPTION: Record<ScenarioKey, string> = {
  diesel_only: "Diesel-only sedang menghitung biaya operasi genset saja.",
  pv_diesel: "PV + diesel sedang mencari kapasitas PV dengan biaya terendah.",
  pv_diesel_battery:
    "PV + diesel + baterai sedang mencari kapasitas PV dan baterai dengan biaya terendah.",
};

export const SCENARIO_DONE_PREFIX: Record<ScenarioKey, string> = {
  diesel_only: "Diesel-only selesai.",
  pv_diesel: "PV + diesel selesai.",
  pv_diesel_battery: "PV + diesel + baterai selesai.",
};

type RunStatusMeta = {
  label: string;
  textClass: string;
  barClass: string;
};

export const RUN_STATUS_META: Record<ScenarioRunStatus, RunStatusMeta> = {
  pending: {
    label: "Menunggu",
    textClass: "text-fg-tertiary",
    barClass: "[&>[data-slot=progress-indicator]]:bg-track",
  },
  running: {
    label: "Berjalan",
    textClass: "text-brand",
    barClass: "[&>[data-slot=progress-indicator]]:bg-brand",
  },
  optimal: {
    label: "Selesai · optimal",
    textClass: "text-success",
    barClass: "[&>[data-slot=progress-indicator]]:bg-success",
  },
  infeasible: {
    label: "Gagal · infeasible",
    textClass: "text-danger",
    barClass: "[&>[data-slot=progress-indicator]]:bg-danger",
  },
  error: {
    label: "Gagal · error",
    textClass: "text-danger",
    barClass: "[&>[data-slot=progress-indicator]]:bg-danger",
  },
  skipped: {
    label: "Dilewati",
    textClass: "text-fg-tertiary",
    barClass: "[&>[data-slot=progress-indicator]]:bg-track",
  },
  cancelled: {
    label: "Dibatalkan",
    textClass: "text-fg-secondary",
    barClass: "[&>[data-slot=progress-indicator]]:bg-fg-tertiary",
  },
};

export const LOG_LEVEL_CLASS: Record<SolverLogLine["level"], string> = {
  command: "text-fg-tertiary",
  info: "text-fg-primary",
  success: "text-success",
  error: "text-danger",
};
