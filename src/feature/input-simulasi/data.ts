import {
  type Icon,
  IconActivity,
  IconAdjustmentsHorizontal,
  IconCoins,
  IconMapPin,
} from "@tabler/icons-react";
import type {
  SimulationFormValues,
  SimulationSectionKey,
} from "@/schemas/simulation/simulation.schema";
import type { FieldSource } from "@/shared/component/NumberField";
import type { SelectOption } from "@/shared/component/SelectField";

/* ------------------------------------------------------------------------ */
/* Nilai default form (studi kasus demo Kampung Yensawai, Raja Ampat)       */
/* ------------------------------------------------------------------------ */

export const DEFAULT_PRESET_ID = "yensawai";

export const SIMULATION_FORM_DEFAULTS: SimulationFormValues = {
  lokasi: {
    nama_desa: "Kampung Yensawai",
    provinsi: "Papua Barat Daya",
    zona_waktu: "WIT",
    latitude: "",
    longitude: "",
  },
  kebutuhan: {
    mode: "contoh",
    preset_id: DEFAULT_PRESET_ID,
    energi_harian: "728,83",
    daya_puncak: "77,90",
    profil_file: null,
  },
  parameter: {
    diesel_kapasitas: "2 × 80",
    diesel_min_load: "30",
    diesel_konsumsi: "0,28",
    pv_maks: "150",
    pv_radiasi: "5,73",
    pv_umur: "25",
    baterai_maks: "300",
    baterai_soc_min: "20",
    baterai_efisiensi: "90",
  },
  biaya: {
    capex_pv: "14,7",
    capex_baterai: "5,7",
    capex_inverter: "4,9",
    harga_solar: "17.100",
    umur_proyek: "25",
    diskonto: "8",
    kurs: "16.300",
    skenario_baseline: true,
    skenario_hybrid: true,
    batas_unserved: "0",
  },
};

/* ------------------------------------------------------------------------ */
/* Stepper                                                                   */
/* ------------------------------------------------------------------------ */

export type SimulationStep = {
  key: SimulationSectionKey;
  number: number;
  title: string;
  description: string;
  sectionTitle: string;
  sectionDescription: string;
  icon: Icon;
};

export const SIMULATION_STEPS: SimulationStep[] = [
  {
    key: "lokasi",
    number: 1,
    title: "Lokasi & kondisi dasar",
    description: "Nama desa dan koordinat",
    sectionTitle: "1. Lokasi & kondisi dasar",
    sectionDescription:
      "Lokasi dipakai untuk mengambil profil surya dan menyesuaikan zona waktu.",
    icon: IconMapPin,
  },
  {
    key: "kebutuhan",
    number: 2,
    title: "Kebutuhan energi",
    description: "Profil beban dan daya puncak",
    sectionTitle: "2. Kebutuhan energi",
    sectionDescription:
      "Profil beban per jam yang sama dipakai untuk kedua skenario.",
    icon: IconActivity,
  },
  {
    key: "parameter",
    number: 3,
    title: "Parameter sistem",
    description: "Batas genset, PV, baterai",
    sectionTitle: "3. Parameter sistem",
    sectionDescription: "Batas teknis yang tidak boleh dilanggar optimizer.",
    icon: IconAdjustmentsHorizontal,
  },
  {
    key: "biaya",
    number: 4,
    title: "Biaya & skenario",
    description: "Harga, umur proyek, skenario",
    sectionTitle: "4. Biaya & skenario",
    sectionDescription:
      "Harga dalam Rupiah. Kurs dipakai untuk mengonversi asumsi berbasis USD.",
    icon: IconCoins,
  },
];

/* ------------------------------------------------------------------------ */
/* Lokasi                                                                    */
/* ------------------------------------------------------------------------ */

export type TimezoneCode = SimulationFormValues["lokasi"]["zona_waktu"];

export const TIMEZONE_OPTIONS: SelectOption[] = [
  { label: "WIB (UTC+7)", value: "WIB" },
  { label: "WITA (UTC+8)", value: "WITA" },
  { label: "WIT (UTC+9)", value: "WIT" },
];

const PROVINCES_BY_TIMEZONE: Record<TimezoneCode, string[]> = {
  WIB: [
    "Aceh",
    "Sumatera Utara",
    "Sumatera Barat",
    "Riau",
    "Kepulauan Riau",
    "Jambi",
    "Sumatera Selatan",
    "Kepulauan Bangka Belitung",
    "Bengkulu",
    "Lampung",
    "DKI Jakarta",
    "Jawa Barat",
    "Banten",
    "Jawa Tengah",
    "DI Yogyakarta",
    "Jawa Timur",
    "Kalimantan Barat",
    "Kalimantan Tengah",
  ],
  WITA: [
    "Bali",
    "Nusa Tenggara Barat",
    "Nusa Tenggara Timur",
    "Kalimantan Selatan",
    "Kalimantan Timur",
    "Kalimantan Utara",
    "Sulawesi Utara",
    "Gorontalo",
    "Sulawesi Tengah",
    "Sulawesi Barat",
    "Sulawesi Selatan",
    "Sulawesi Tenggara",
  ],
  WIT: [
    "Maluku",
    "Maluku Utara",
    "Papua",
    "Papua Barat",
    "Papua Barat Daya",
    "Papua Selatan",
    "Papua Tengah",
    "Papua Pegunungan",
  ],
};

export const PROVINCE_TIMEZONE: Record<string, TimezoneCode> =
  Object.fromEntries(
    (Object.keys(PROVINCES_BY_TIMEZONE) as TimezoneCode[]).flatMap((tz) =>
      PROVINCES_BY_TIMEZONE[tz].map((province) => [province, tz]),
    ),
  );

export const PROVINCE_OPTIONS: SelectOption[] = Object.keys(PROVINCE_TIMEZONE)
  .sort((a, b) => a.localeCompare(b, "id"))
  .map((province) => ({ label: province, value: province }));

/* ------------------------------------------------------------------------ */
/* Field angka                                                               */
/* ------------------------------------------------------------------------ */

export const SOURCE = {
  paper: { tone: "paper", label: "Paper 2024" },
  user: { tone: "user", label: "Input pengguna" },
  demo: { tone: "assumption", label: "Asumsi demo" },
} satisfies Record<string, FieldSource>;

export type NumberFieldMeta = {
  label: string;
  unit: string;
  helper: string;
  /** Sumber nilai default. Berubah jadi "Input pengguna" saat nilai diubah. */
  source: FieldSource;
};

type ParameterKey = keyof SimulationFormValues["parameter"];
type BiayaNumberKey = Exclude<
  keyof SimulationFormValues["biaya"],
  "skenario_baseline" | "skenario_hybrid"
>;
type KebutuhanNumberKey = "energi_harian" | "daya_puncak";

export const KEBUTUHAN_FIELDS: Record<KebutuhanNumberKey, NumberFieldMeta> = {
  energi_harian: {
    label: "Total energi harian",
    unit: "kWh/hari",
    helper: "Dari catatan operator genset.",
    source: SOURCE.user,
  },
  daya_puncak: {
    label: "Daya puncak",
    unit: "kW",
    helper: "Beban tertinggi dalam sehari.",
    source: SOURCE.user,
  },
};

export const PARAMETER_FIELDS: Record<ParameterKey, NumberFieldMeta> = {
  diesel_kapasitas: {
    label: "Kapasitas terpasang",
    unit: "kW",
    helper: "Dua unit eksisting.",
    source: SOURCE.paper,
  },
  diesel_min_load: {
    label: "Minimum load per unit",
    unit: "% kapasitas",
    helper: "Cek manual pabrikan.",
    source: SOURCE.demo,
  },
  diesel_konsumsi: {
    label: "Konsumsi spesifik",
    unit: "liter/kWh",
    helper: "Dari kurva konsumsi.",
    source: SOURCE.demo,
  },
  pv_maks: {
    label: "Kapasitas maksimum",
    unit: "kWp",
    helper: "Dibatasi luas lahan.",
    source: SOURCE.user,
  },
  pv_radiasi: {
    label: "Radiasi rata-rata",
    unit: "kWh/m²/hari",
    helper: "Dipakai jika koordinat kosong.",
    source: SOURCE.paper,
  },
  pv_umur: {
    label: "Umur PV",
    unit: "tahun",
    helper: "Umur teknis modul.",
    source: SOURCE.demo,
  },
  baterai_maks: {
    label: "Kapasitas maksimum",
    unit: "kWh",
    helper: "Batas atas pencarian.",
    source: SOURCE.user,
  },
  baterai_soc_min: {
    label: "SOC minimum",
    unit: "%",
    helper: "Batas aman pengosongan.",
    source: SOURCE.demo,
  },
  baterai_efisiensi: {
    label: "Efisiensi round-trip",
    unit: "%",
    helper: "Charge × discharge.",
    source: SOURCE.demo,
  },
};

export const BIAYA_FIELDS: Record<BiayaNumberKey, NumberFieldMeta> = {
  capex_pv: {
    label: "CAPEX panel surya",
    unit: "juta Rp/kWp",
    helper: "Setara {usd} USD/kWp.",
    source: SOURCE.demo,
  },
  capex_baterai: {
    label: "CAPEX baterai",
    unit: "juta Rp/kWh",
    helper: "Setara {usd} USD/kWh.",
    source: SOURCE.demo,
  },
  capex_inverter: {
    label: "CAPEX inverter",
    unit: "juta Rp/kW",
    helper: "Setara {usd} USD/kW.",
    source: SOURCE.demo,
  },
  harga_solar: {
    label: "Harga solar",
    unit: "Rp/liter",
    helper: "Harga sampai di lokasi.",
    source: SOURCE.user,
  },
  umur_proyek: {
    label: "Umur proyek",
    unit: "tahun",
    helper: "Horizon NPC.",
    source: SOURCE.demo,
  },
  diskonto: {
    label: "Tingkat diskonto",
    unit: "%/tahun",
    helper: "Nilai kini biaya.",
    source: SOURCE.demo,
  },
  kurs: {
    label: "Kurs",
    unit: "Rp/USD",
    helper: "Isi kurs saat analisis.",
    source: SOURCE.user,
  },
  batas_unserved: {
    label: "Batas beban tak terlayani",
    unit: "% energi/tahun",
    helper: "0 % = semua beban wajib terlayani.",
    source: SOURCE.user,
  },
};

export const SCENARIO_OPTIONS = [
  { key: "skenario_baseline", label: "Diesel saja (baseline)" },
  { key: "skenario_hybrid", label: "Diesel + PV + baterai (hybrid)" },
] as const;

export const LOAD_PROFILE_COLUMNS = "timestamp, load_kW";
export const LOAD_PROFILE_FORMAT_NOTE =
  "Format .csv atau .xlsx · 24 atau 8.760 baris";
