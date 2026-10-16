import type {
  ScenarioKey,
  ScenarioRunStatus,
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

/*
 * Backend menjalankan semua skenario dalam satu request, jadi progres per
 * skenario hanya perkiraan dari waktu berjalan; status akhirnya baru
 * diketahui saat respons tiba.
 */
export const RUNNING_DESCRIPTION =
  "Profil beban & PV per jam dibentuk, lalu skenario dioptimasi. Progres di bawah adalah perkiraan.";

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
  feasible: {
    label: "Selesai · feasible",
    textClass: "text-warning",
    barClass: "[&>[data-slot=progress-indicator]]:bg-warning",
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
