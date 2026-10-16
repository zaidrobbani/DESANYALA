import {
  type Icon,
  IconActivity,
  IconAdjustmentsHorizontal,
  IconBatteryCharging2,
  IconCoins,
  IconEngine,
  IconMapPin,
  IconSolarPanel,
} from "@tabler/icons-react";
import type { ScenarioKey } from "@/repository/simulation/dto";
import {
  type DemandLoadFormValues,
  LOAD_CATEGORIES,
  type SimulationFormSection,
  type SimulationFormValues,
} from "@/schemas/simulation/simulation.schema";
import type { FieldSource } from "@/shared/component/NumberField";
import type { SelectOption } from "@/shared/component/SelectField";

/*
 * Mengikuti desanyala_input_cards.html + desanyala_variable_names.txt.
 * `id` di setiap meta field = HTML ID pada referensi (mis. "pvCapex"),
 * sedangkan nama field form = JSON path (mis. "pv.capex_per_kwp").
 */

/* ------------------------------------------------------------------------ */
/* Nilai default form (contoh angka awal dari HTML referensi)                */
/* ------------------------------------------------------------------------ */

export const NEW_LOAD: DemandLoadFormValues = {
  category: "Rumah tangga",
  device: "",
  quantity: "1",
  power_w: "",
  hours_per_day: "4",
};

export const SIMULATION_FORM_DEFAULTS: SimulationFormValues = {
  project: {
    name: "",
    location: "",
    households: "150",
    electrification_status: "unserved",
    simulation_days: "365",
    project_lifetime_years: "20",
    currency: "IDR",
  },
  demand: {
    loads: [
      {
        category: "Rumah tangga",
        device: "Lampu LED",
        quantity: "150",
        power_w: "10",
        hours_per_day: "6",
      },
      {
        category: "Fasilitas umum",
        device: "Lampu sekolah",
        quantity: "20",
        power_w: "20",
        hours_per_day: "6",
      },
      {
        category: "Pompa air",
        device: "Pompa air",
        quantity: "1",
        power_w: "750",
        hours_per_day: "4",
      },
    ],
  },
  pv: {
    enabled: true,
    resource_location: "",
    peak_sun_hours_estimate: "4,5",
    system_performance_factor: "80",
    capacity_mode: "optimize",
    fixed_capacity_kwp: "50",
    capacity_min_kwp: "0",
    capacity_max_kwp: "200",
    capex_per_kwp: "15.000.000",
    opex_annual_per_kwp: "150.000",
    lifetime_years: "25",
  },
  generators: {
    mode: "existing",
    unit_count: "2",
    rated_power_each_kw: "50",
    min_loading_fraction: "30",
    max_loading_fraction: "100",
    fuel_price_per_liter: "10.000",
    fuel_model: "default",
    efficiency_fraction: "33",
    capex_per_kw: "12.500.000",
    opex_annual_per_unit: "5.000.000",
    lifetime_years: "10",
  },
  battery: {
    enabled: true,
    capacity_min_kwh: "0",
    capacity_max_kwh: "200",
    power_max_kw: "50",
    charge_efficiency: "97",
    discharge_efficiency: "97",
    soc_min_fraction: "20",
    soc_max_fraction: "100",
    soc_initial_fraction: "50",
    capex_per_kwh: "2.500.000",
    power_capex_per_kw: "500.000",
    lifetime_years: "13",
  },
  economics: {
    discount_rate: "8",
    fuel_price_escalation_annual: "0",
    additional_project_cost: "0",
  },
  reliability: {
    target_supply_fraction: "99,5",
    shortage_policy: "forbid",
    max_unmet_energy_fraction: "0,5",
    reserve_margin_fraction: "10",
  },
  optimization: {
    objective: "annualized_cost",
    scenario: "pv_diesel_battery",
  },
};

/* ------------------------------------------------------------------------ */
/* Stepper (satu langkah = satu card di HTML referensi)                      */
/* ------------------------------------------------------------------------ */

export type SimulationStepKey =
  | "card-project"
  | "card-demand"
  | "card-pv"
  | "card-gen"
  | "card-battery"
  | "card-economics"
  | "card-optimization";

export type SimulationStep = {
  /** Id elemen card (sama dengan HTML referensi). */
  key: SimulationStepKey;
  /** Bagian form yang errornya ditandai di langkah ini. */
  sections: SimulationFormSection[];
  number: number;
  title: string;
  description: string;
  sectionTitle: string;
  sectionDescription: string;
  icon: Icon;
};

export const SIMULATION_STEPS: SimulationStep[] = [
  {
    key: "card-project",
    sections: ["project"],
    number: 1,
    title: "Proyek & simulasi",
    description: "Lokasi, elektrifikasi, periode",
    sectionTitle: "1. Proyek & simulasi",
    sectionDescription:
      "Informasi lokasi, kondisi elektrifikasi, dan periode analisis.",
    icon: IconMapPin,
  },
  {
    key: "card-demand",
    sections: ["demand"],
    number: 2,
    title: "Kebutuhan listrik",
    description: "Daftar peralatan desa",
    sectionTitle: "2. Kebutuhan listrik",
    sectionDescription:
      "Susun beban dari peralatan desa. Estimasi energi dihitung dari jumlah unit, daya, dan jam penggunaan.",
    icon: IconActivity,
  },
  {
    key: "card-pv",
    sections: ["pv"],
    number: 3,
    title: "Panel surya (PV)",
    description: "Sumber daya & batas kapasitas",
    sectionTitle: "3. Panel surya (PV)",
    sectionDescription:
      "Ketersediaan energi surya dan batas kapasitas panel yang boleh dipilih optimizer.",
    icon: IconSolarPanel,
  },
  {
    key: "card-gen",
    sections: ["generators"],
    number: 4,
    title: "Generator diesel",
    description: "Unit, bahan bakar, biaya",
    sectionTitle: "4. Generator diesel",
    sectionDescription:
      "Spesifikasi genset yang tersedia atau kapasitas genset yang direncanakan.",
    icon: IconEngine,
  },
  {
    key: "card-battery",
    sections: ["battery"],
    number: 5,
    title: "Baterai",
    description: "Opsional, kapasitas & SOC",
    sectionTitle: "5. Baterai",
    sectionDescription:
      "Penyimpanan energi opsional untuk menggeser pemakaian energi antarwaktu.",
    icon: IconBatteryCharging2,
  },
  {
    key: "card-economics",
    sections: ["economics"],
    number: 6,
    title: "Asumsi ekonomi",
    description: "Mata uang, diskonto",
    sectionTitle: "6. Asumsi ekonomi",
    sectionDescription:
      "Asumsi finansial untuk membandingkan sistem sepanjang umur proyek.",
    icon: IconCoins,
  },
  {
    key: "card-optimization",
    sections: ["reliability", "optimization"],
    number: 7,
    title: "Keandalan & optimasi",
    description: "Target layanan, skenario",
    sectionTitle: "7. Keandalan & optimasi",
    sectionDescription:
      "Tingkat layanan minimum dan skenario yang dijalankan engine.",
    icon: IconAdjustmentsHorizontal,
  },
];

/* ------------------------------------------------------------------------ */
/* Opsi select                                                               */
/* ------------------------------------------------------------------------ */

export const ELECTRIFICATION_OPTIONS: SelectOption[] = [
  { label: "Belum memiliki akses listrik yang memadai", value: "unserved" },
  { label: "Genset sudah tersedia", value: "diesel_existing" },
  { label: "Sistem PV dan genset sudah tersedia", value: "hybrid_existing" },
];

export const SIMULATION_DAYS_OPTIONS: SelectOption[] = [
  { label: "365 hari · tahunan", value: "365" },
  { label: "30 hari · uji awal", value: "30" },
  { label: "7 hari · uji cepat", value: "7" },
];

export const LOAD_CATEGORY_OPTIONS: SelectOption[] = LOAD_CATEGORIES.map(
  (category) => ({ label: category, value: category }),
);

export const PV_CAPACITY_MODE_OPTIONS: SelectOption[] = [
  { label: "Dioptimalkan oleh sistem", value: "optimize" },
  { label: "Kapasitas tetap", value: "fixed" },
];

export const GENERATOR_MODE_OPTIONS: SelectOption[] = [
  { label: "Genset sudah tersedia", value: "existing" },
  { label: "Merencanakan genset baru", value: "new" },
];

export const FUEL_MODEL_OPTIONS: SelectOption[] = [
  { label: "Gunakan asumsi efisiensi", value: "default" },
  { label: "Masukkan efisiensi", value: "efficiency" },
  { label: "Kurva konsumsi bahan bakar", value: "curve" },
];

export const CURRENCY_OPTIONS: SelectOption[] = [
  { label: "Rupiah (IDR)", value: "IDR" },
  { label: "US Dollar (USD)", value: "USD" },
];

export const SHORTAGE_POLICY_OPTIONS: SelectOption[] = [
  { label: "Tidak diizinkan", value: "forbid" },
  { label: "Diizinkan dalam batas tertentu", value: "bounded" },
];

export const OBJECTIVE_OPTIONS: SelectOption[] = [
  { label: "Biaya tahunan sistem minimum", value: "annualized_cost" },
  { label: "Konsumsi diesel minimum", value: "fuel_consumption" },
];

/** Satu skenario per run (dropdown #scenario). */
export const SCENARIO_OPTIONS: {
  id: ScenarioKey;
  label: string;
  description: string;
}[] = [
  {
    id: "diesel_only",
    label: "Diesel-only",
    description: "Hanya genset diesel, tanpa panel surya dan baterai.",
  },
  {
    id: "pv_diesel",
    label: "PV + diesel",
    description: "Panel surya dengan genset diesel sebagai cadangan.",
  },
  {
    id: "pv_diesel_battery",
    label: "PV + diesel + baterai",
    description: "Panel surya, baterai penyimpan energi, dan genset diesel.",
  },
];

/* ------------------------------------------------------------------------ */
/* Field angka                                                               */
/* ------------------------------------------------------------------------ */

export const SOURCE = {
  user: { tone: "user", label: "Input pengguna" },
  example: { tone: "assumption", label: "Contoh awal" },
} satisfies Record<string, FieldSource>;

export type NumberFieldMeta = {
  /** HTML ID di desanyala_input_cards.html. */
  id: string;
  label: string;
  /** `{cur}` diganti mata uang proyek (IDR/USD). */
  unit: string;
  helper?: string;
  /** Sumber nilai default. Berubah jadi "Input pengguna" saat nilai diubah. */
  source: FieldSource;
};

/** Key bertipe `string` murni (field angka/teks), bukan enum atau boolean. */
type NumberKeys<T> = {
  [K in keyof T]: string extends T[K] ? K : never;
}[keyof T];

type FieldMetaOf<S extends SimulationFormSection, K = never> = Record<
  Exclude<NumberKeys<SimulationFormValues[S]>, K>,
  NumberFieldMeta
>;

const field = (
  id: string,
  label: string,
  unit: string,
  helper?: string,
): NumberFieldMeta => ({ id, label, unit, helper, source: SOURCE.example });

export const PROJECT_FIELDS: Pick<
  FieldMetaOf<"project">,
  "households" | "project_lifetime_years"
> = {
  households: field(
    "households",
    "Jumlah rumah tangga",
    "rumah",
    "Konteks estimasi kebutuhan, bukan pengganti daftar beban.",
  ),
  project_lifetime_years: field("projectLifetime", "Umur proyek", "tahun"),
};

export const PV_FIELDS: FieldMetaOf<"pv", "resource_location"> = {
  peak_sun_hours_estimate: field(
    "solarHours",
    "Jam matahari efektif (estimasi)",
    "jam/hari",
  ),
  system_performance_factor: field(
    "pvDerate",
    "Faktor performa sistem",
    "%",
    "Pendekatan rugi-rugi sistem; harus konsisten dengan model profil PV.",
  ),
  fixed_capacity_kwp: field("pvFixed", "Kapasitas PV tetap", "kWp"),
  capacity_min_kwp: field("pvMin", "Kapasitas minimum", "kWp"),
  capacity_max_kwp: field("pvMax", "Kapasitas maksimum", "kWp"),
  capex_per_kwp: field("pvCapex", "Investasi PV", "{cur}/kWp"),
  opex_annual_per_kwp: field("pvOpex", "Biaya O&M tahunan PV", "{cur}/kWp/thn"),
  lifetime_years: field("pvLife", "Umur pakai PV", "tahun"),
};

export const GENERATOR_FIELDS: FieldMetaOf<"generators"> = {
  unit_count: field("genCount", "Jumlah unit genset", "unit"),
  rated_power_each_kw: field(
    "genPower",
    "Kapasitas per unit",
    "kW",
    "Untuk unit yang identik.",
  ),
  min_loading_fraction: field("genMinLoad", "Beban minimum operasi", "%"),
  max_loading_fraction: field("genMaxLoad", "Beban maksimum operasi", "%"),
  fuel_price_per_liter: field("fuelPrice", "Harga diesel", "{cur}/L"),
  efficiency_fraction: field(
    "genEfficiency",
    "Efisiensi genset",
    "%",
    "Perkiraan awal. Data konsumsi pabrikan lebih baik jika tersedia.",
  ),
  capex_per_kw: field("genCapex", "Investasi genset baru", "{cur}/kW"),
  opex_annual_per_unit: field("genOpex", "O&M tahunan per unit", "{cur}/tahun"),
  lifetime_years: field("genLife", "Umur pakai genset", "tahun"),
};

export const BATTERY_FIELDS: FieldMetaOf<"battery"> = {
  capacity_min_kwh: field("batMin", "Kapasitas energi minimum", "kWh"),
  capacity_max_kwh: field("batMax", "Kapasitas energi maksimum", "kWh"),
  power_max_kw: field("batPower", "Daya maksimum", "kW"),
  charge_efficiency: field("batChargeEff", "Efisiensi pengisian", "%"),
  discharge_efficiency: field("batDischargeEff", "Efisiensi pengosongan", "%"),
  soc_min_fraction: field("batSocMin", "SOC minimum", "%"),
  soc_max_fraction: field("batSocMax", "SOC maksimum", "%"),
  soc_initial_fraction: field("batSocInitial", "SOC awal", "%"),
  capex_per_kwh: field("batCapex", "Investasi kapasitas energi", "{cur}/kWh"),
  power_capex_per_kw: field(
    "batPowerCapex",
    "Investasi kapasitas daya",
    "{cur}/kW",
  ),
  lifetime_years: field("batLife", "Umur pakai baterai", "tahun"),
};

export const ECONOMICS_FIELDS: FieldMetaOf<"economics"> = {
  discount_rate: field("discountRate", "Tingkat diskonto", "%/tahun"),
  fuel_price_escalation_annual: field(
    "fuelEscalation",
    "Perubahan harga diesel tahunan",
    "%/tahun",
    "Gunakan 0 sampai rumus eskalasi bahan bakar tervalidasi.",
  ),
  additional_project_cost: field(
    "projectExtraCost",
    "Biaya proyek tambahan",
    "{cur}",
    "Mis. instalasi atau biaya pengembangan yang belum tercakup.",
  ),
};

export const RELIABILITY_FIELDS: FieldMetaOf<"reliability"> = {
  target_supply_fraction: field(
    "targetReliability",
    "Target pemenuhan kebutuhan",
    "%",
  ),
  max_unmet_energy_fraction: field(
    "maxUnmet",
    "Maksimum energi tak terpenuhi",
    "%/tahun",
  ),
  reserve_margin_fraction: field(
    "reserveMargin",
    "Cadangan daya minimum",
    "%",
    "Kebutuhan model tambahan; belum tentu tersedia di konfigurasi standar.",
  ),
};
