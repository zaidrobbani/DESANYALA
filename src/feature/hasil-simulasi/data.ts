import {
  type Icon,
  IconArrowsExchange,
  IconBatteryCharging2,
  IconEngine,
  IconSolarPanel,
} from "@tabler/icons-react";
import type { FieldPath } from "react-hook-form";
import type {
  ComponentKey,
  ConflictIssue,
  ScenarioKey,
  SimulationInputPath,
} from "@/repository/simulation/dto";
import type { SimulationFormValues } from "@/schemas/simulation/simulation.schema";
import type { SourceTone } from "@/shared/component/SourceBadge";

type ScenarioMeta = {
  /** Nama skenario di log solver. */
  name: string;
  /** Nama panjang (legenda, panel rekomendasi). */
  label: string;
  /** Nama pendek (label sumbu grafik). */
  shortLabel: string;
  /** Warna batang di grafik perbandingan. */
  color: string;
  swatchClass: string;
};

export const SCENARIO_META: Record<ScenarioKey, ScenarioMeta> = {
  baseline: {
    name: "Baseline",
    label: "Diesel saja",
    shortLabel: "Diesel saja",
    color: "var(--energy-diesel)",
    swatchClass: "bg-energy-diesel",
  },
  hybrid: {
    name: "Hybrid",
    label: "Diesel + PV + baterai",
    shortLabel: "Hybrid",
    color: "var(--brand-primary)",
    swatchClass: "bg-brand",
  },
};

export const SCENARIO_ORDER: ScenarioKey[] = ["baseline", "hybrid"];

type ComponentMeta = {
  label: string;
  icon: Icon;
  iconClass: string;
  /** Keterangan di kolom "Energi dipasok" bila porsi energi tidak relevan. */
  role: string;
};

export const COMPONENT_META: Record<ComponentKey, ComponentMeta> = {
  pv: {
    label: "Panel surya",
    icon: IconSolarPanel,
    iconClass: "text-energy-pv-ink",
    role: "Memasok beban siang",
  },
  battery: {
    label: "Baterai",
    icon: IconBatteryCharging2,
    iconClass: "text-energy-battery",
    role: "Menyimpan surplus PV siang",
  },
  inverter: {
    label: "Inverter",
    icon: IconArrowsExchange,
    iconClass: "text-brand",
    role: "Mengubah DC ke AC",
  },
  diesel: {
    label: "Genset diesel",
    icon: IconEngine,
    iconClass: "text-energy-diesel",
    role: "Cadangan dan beban malam",
  },
};

export const COMPONENT_ORDER: ComponentKey[] = [
  "pv",
  "battery",
  "inverter",
  "diesel",
];

/** Seri grafik aliran energi harian, urutan = urutan tumpukan & legenda. */
export const DISPATCH_SERIES = [
  {
    key: "diesel",
    label: "Diesel (kW)",
    color: "var(--energy-diesel)",
    swatchClass: "bg-energy-diesel",
  },
  {
    key: "pv",
    label: "PV (kW)",
    color: "var(--energy-pv)",
    swatchClass: "bg-energy-pv",
  },
  {
    key: "discharge",
    label: "Baterai discharge (kW)",
    color: "var(--energy-battery)",
    swatchClass: "bg-energy-battery",
  },
  {
    key: "charge",
    label: "Baterai charge (kW)",
    color: "var(--energy-battery-charge)",
    swatchClass: "bg-energy-battery-charge",
  },
] as const;

export const LOAD_SERIES = {
  key: "load",
  label: "Beban (kW)",
  color: "var(--energy-load)",
  swatchClass: "bg-energy-load",
} as const;

export const DETAIL_TABS = [
  { value: "ringkasan", label: "Ringkasan" },
  { value: "komponen", label: "Komponen" },
  { value: "parameter", label: "Parameter" },
] as const;

export type DetailTab = (typeof DETAIL_TABS)[number]["value"];

export const RESULT_DISCLAIMER =
  "Hasil ini estimasi model berdasarkan asumsi skenario. Implementasi tetap butuh studi kelayakan lapangan, audit teknik, dan desain proteksi.";

/* ------------------------------------------------------------------------ */
/* Diagnosis infeasible                                                     */
/* ------------------------------------------------------------------------ */

type InputFieldLocation = {
  /** Nama field form input (juga id elemen) untuk tombol "Ubah di input". */
  field: FieldPath<SimulationFormValues>;
  section: string;
};

const PARAMETER_SECTION = "3. Parameter sistem";

export const INPUT_FIELD_LOCATION: Record<
  SimulationInputPath,
  InputFieldLocation
> = {
  "diesel.units": {
    field: "parameter.diesel_kapasitas",
    section: PARAMETER_SECTION,
  },
  "diesel.unit_capacity_kw": {
    field: "parameter.diesel_kapasitas",
    section: PARAMETER_SECTION,
  },
  "diesel.min_load_pct": {
    field: "parameter.diesel_min_load",
    section: PARAMETER_SECTION,
  },
  "pv.max_capacity_kwp": {
    field: "parameter.pv_maks",
    section: PARAMETER_SECTION,
  },
  "battery.max_capacity_kwh": {
    field: "parameter.baterai_maks",
    section: PARAMETER_SECTION,
  },
  "battery.min_soc_pct": {
    field: "parameter.baterai_soc_min",
    section: PARAMETER_SECTION,
  },
  max_unserved_energy_pct: {
    field: "biaya.batas_unserved",
    section: "4. Biaya & skenario",
  },
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
