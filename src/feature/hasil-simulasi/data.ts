import {
  type Icon,
  IconArrowsExchange,
  IconBatteryCharging2,
  IconEngine,
  IconSolarPanel,
} from "@tabler/icons-react";
import type { ComponentKey, ScenarioKey } from "@/repository/simulation/dto";

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
