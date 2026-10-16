import { z } from "zod";
import { parseIdNumber } from "@/shared/util/number";

/*
 * Struktur & nama field form = JSON path kontrak `desanyala.input.v1`
 * (lihat SimulationRequest di repository/simulation/dto.ts), mis.
 * `pv.capex_per_kwp`, `demand.loads.0.power_w`.
 *
 * Semua field angka disimpan sebagai string di form (format Indonesia:
 * "15.000.000", "4,5") supaya input tidak "lompat" saat diketik.
 * Field `*_fraction`, `*_efficiency`, `*_factor`, `discount_rate`, dan
 * `fuel_price_escalation_annual` diisi dalam persen (0..100) di UI, lalu
 * dibagi 100 oleh mapper `toSimulationRequest`.
 */

export const LOAD_CATEGORIES = [
  "Rumah tangga",
  "Sekolah",
  "Puskesmas",
  "Pompa air",
  "UMKM",
  "Fasilitas umum",
  "Lainnya",
] as const;

export const SCENARIO_IDS = [
  "diesel_only",
  "pv_diesel",
  "pv_diesel_battery",
] as const;

export const SIMULATION_DAYS = ["365", "30", "7"] as const;

type NumberRule = {
  label: string;
  min?: number;
  max?: number;
  /** Batas bawah eksklusif (nilai harus > gt). */
  gt?: number;
  integer?: boolean;
};

const percent = (label: string, min = 0): NumberRule => ({
  label,
  min,
  max: 100,
});

const lifetime = (label: string): NumberRule => ({
  label,
  min: 1,
  max: 60,
  integer: true,
});

/** Pesan error untuk satu input angka, atau null bila valid. */
const numberIssue = (raw: string, rule: NumberRule): string | null => {
  const { label } = rule;
  if (raw.trim() === "") return `${label} wajib diisi`;
  const value = parseIdNumber(raw);
  if (Number.isNaN(value)) return "Format angka tidak valid";
  if (rule.integer && !Number.isInteger(value)) {
    return `${label} harus bilangan bulat`;
  }
  if (rule.gt !== undefined && value <= rule.gt) {
    return `${label} harus lebih dari ${rule.gt}`;
  }
  if (rule.min !== undefined && value < rule.min) {
    return `${label} minimal ${rule.min}`;
  }
  if (rule.max !== undefined && value > rule.max) {
    return `${label} maksimal ${rule.max}`;
  }
  return null;
};

/**
 * Validasi beberapa field angka sekaligus di dalam superRefine.
 * Mengembalikan nilai number untuk field yang valid (untuk cek antar-field).
 */
const checkNumbers = <K extends string>(
  ctx: z.RefinementCtx,
  data: Record<K, unknown>,
  rules: Partial<Record<K, NumberRule>>,
) => {
  const values: Partial<Record<K, number>> = {};
  for (const key of Object.keys(rules) as K[]) {
    const rule = rules[key];
    if (!rule) continue;
    const raw = String(data[key] ?? "");
    const message = numberIssue(raw, rule);
    if (message) {
      ctx.addIssue({ code: "custom", path: [key], message });
    } else {
      values[key] = parseIdNumber(raw);
    }
  }
  return values;
};

const issue = (ctx: z.RefinementCtx, path: string, message: string) =>
  ctx.addIssue({ code: "custom", path: [path], message });

/* ------------------------------------------------------------------------ */
/* Card 01 · Project & simulation                                            */
/* ------------------------------------------------------------------------ */

export const projectSchema = z
  .object({
    name: z.string().trim().min(1, "Nama proyek wajib diisi").max(120),
    location: z
      .string()
      .trim()
      .min(1, "Lokasi administratif wajib diisi")
      .max(200),
    households: z.string(),
    electrification_status: z.enum([
      "unserved",
      "diesel_existing",
      "hybrid_existing",
    ]),
    simulation_days: z.enum(SIMULATION_DAYS),
    project_lifetime_years: z.string(),
    /** Ditampilkan di card 06, tetapi masuk `project.currency` di JSON. */
    currency: z.enum(["IDR", "USD"]),
  })
  .superRefine((data, ctx) => {
    checkNumbers(ctx, data, {
      households: { label: "Jumlah rumah tangga", min: 0, integer: true },
      project_lifetime_years: lifetime("Umur proyek"),
    });
  });

/* ------------------------------------------------------------------------ */
/* Card 02 · Electricity demand                                              */
/* ------------------------------------------------------------------------ */

export const demandLoadSchema = z
  .object({
    category: z.enum(LOAD_CATEGORIES),
    device: z.string().trim().min(1, "Nama peralatan wajib diisi"),
    quantity: z.string(),
    power_w: z.string(),
    hours_per_day: z.string(),
  })
  .superRefine((data, ctx) => {
    checkNumbers(ctx, data, {
      quantity: { label: "Jumlah unit", min: 0, integer: true },
      power_w: { label: "Daya", min: 0 },
      hours_per_day: { label: "Jam/hari", min: 0, max: 24 },
    });
  });

export const demandSchema = z.object({
  loads: z.array(demandLoadSchema).min(1, "Tambahkan minimal satu peralatan"),
});

/* ------------------------------------------------------------------------ */
/* Card 03 · Solar PV                                                        */
/* ------------------------------------------------------------------------ */

export const pvSchema = z
  .object({
    enabled: z.boolean(),
    resource_location: z.string().trim().max(200),
    peak_sun_hours_estimate: z.string(),
    system_performance_factor: z.string(),
    capacity_mode: z.enum(["optimize", "fixed"]),
    fixed_capacity_kwp: z.string(),
    capacity_min_kwp: z.string(),
    capacity_max_kwp: z.string(),
    capex_per_kwp: z.string(),
    opex_annual_per_kwp: z.string(),
    lifetime_years: z.string(),
  })
  .superRefine((data, ctx) => {
    // Field PV disembunyikan saat PV nonaktif, jadi tidak divalidasi.
    if (!data.enabled) return;
    const values = checkNumbers(ctx, data, {
      peak_sun_hours_estimate: {
        label: "Jam matahari efektif",
        min: 0,
        max: 12,
      },
      system_performance_factor: percent("Faktor performa", 1),
      fixed_capacity_kwp:
        data.capacity_mode === "fixed"
          ? { label: "Kapasitas PV tetap", min: 0 }
          : undefined,
      capacity_min_kwp: { label: "Kapasitas minimum", min: 0 },
      capacity_max_kwp: { label: "Kapasitas maksimum", min: 0 },
      capex_per_kwp: { label: "Investasi PV", min: 0 },
      opex_annual_per_kwp: { label: "Biaya O&M PV", min: 0 },
      lifetime_years: lifetime("Umur pakai PV"),
    });
    const { capacity_min_kwp: min, capacity_max_kwp: max } = values;
    if (min !== undefined && max !== undefined && min > max) {
      issue(
        ctx,
        "capacity_max_kwp",
        "Kapasitas maksimum tidak boleh lebih kecil dari minimum",
      );
    }
  });

/* ------------------------------------------------------------------------ */
/* Card 04 · Diesel generator                                                */
/* ------------------------------------------------------------------------ */

export const generatorsSchema = z
  .object({
    mode: z.enum(["existing", "new"]),
    unit_count: z.string(),
    rated_power_each_kw: z.string(),
    min_loading_fraction: z.string(),
    max_loading_fraction: z.string(),
    fuel_price_per_liter: z.string(),
    fuel_model: z.enum(["default", "efficiency", "curve"]),
    efficiency_fraction: z.string(),
    capex_per_kw: z.string(),
    opex_annual_per_unit: z.string(),
    lifetime_years: z.string(),
  })
  .superRefine((data, ctx) => {
    const values = checkNumbers(ctx, data, {
      unit_count: { label: "Jumlah unit", min: 1, max: 20, integer: true },
      rated_power_each_kw: { label: "Kapasitas per unit", gt: 0 },
      min_loading_fraction: percent("Beban minimum"),
      max_loading_fraction: percent("Beban maksimum", 1),
      fuel_price_per_liter: { label: "Harga diesel", min: 0 },
      efficiency_fraction:
        data.fuel_model === "curve"
          ? undefined
          : percent("Efisiensi genset", 1),
      capex_per_kw: { label: "Investasi genset", min: 0 },
      opex_annual_per_unit: { label: "O&M genset", min: 0 },
      lifetime_years: lifetime("Umur pakai genset"),
    });
    const { min_loading_fraction: min, max_loading_fraction: max } = values;
    if (min !== undefined && max !== undefined && min > max) {
      issue(
        ctx,
        "min_loading_fraction",
        "Beban minimum tidak boleh melebihi beban maksimum",
      );
    }
  });

/* ------------------------------------------------------------------------ */
/* Card 05 · Battery storage                                                 */
/* ------------------------------------------------------------------------ */

export const batterySchema = z
  .object({
    enabled: z.boolean(),
    capacity_min_kwh: z.string(),
    capacity_max_kwh: z.string(),
    power_max_kw: z.string(),
    charge_efficiency: z.string(),
    discharge_efficiency: z.string(),
    soc_min_fraction: z.string(),
    soc_max_fraction: z.string(),
    soc_initial_fraction: z.string(),
    capex_per_kwh: z.string(),
    power_capex_per_kw: z.string(),
    lifetime_years: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.enabled) return;
    const values = checkNumbers(ctx, data, {
      capacity_min_kwh: { label: "Kapasitas minimum", min: 0 },
      capacity_max_kwh: { label: "Kapasitas maksimum", min: 0 },
      power_max_kw: { label: "Daya maksimum", min: 0 },
      charge_efficiency: percent("Efisiensi pengisian", 1),
      discharge_efficiency: percent("Efisiensi pengosongan", 1),
      soc_min_fraction: percent("SOC minimum"),
      soc_max_fraction: percent("SOC maksimum", 1),
      soc_initial_fraction: percent("SOC awal"),
      capex_per_kwh: { label: "Investasi kapasitas energi", min: 0 },
      power_capex_per_kw: { label: "Investasi kapasitas daya", min: 0 },
      lifetime_years: lifetime("Umur pakai baterai"),
    });
    const {
      capacity_min_kwh: capMin,
      capacity_max_kwh: capMax,
      soc_min_fraction: socMin,
      soc_max_fraction: socMax,
      soc_initial_fraction: socInitial,
    } = values;
    if (capMin !== undefined && capMax !== undefined && capMin > capMax) {
      issue(
        ctx,
        "capacity_max_kwh",
        "Kapasitas maksimum tidak boleh lebih kecil dari minimum",
      );
    }
    if (socMin !== undefined && socMax !== undefined) {
      if (socMin > socMax) {
        issue(ctx, "soc_min_fraction", "SOC minimum melebihi SOC maksimum");
      } else if (
        socInitial !== undefined &&
        (socInitial < socMin || socInitial > socMax)
      ) {
        issue(
          ctx,
          "soc_initial_fraction",
          "SOC awal harus di antara SOC minimum dan maksimum",
        );
      }
    }
  });

/* ------------------------------------------------------------------------ */
/* Card 06 · Economic assumptions                                            */
/* ------------------------------------------------------------------------ */

export const economicsSchema = z
  .object({
    discount_rate: z.string(),
    fuel_price_escalation_annual: z.string(),
    additional_project_cost: z.string(),
  })
  .superRefine((data, ctx) => {
    checkNumbers(ctx, data, {
      discount_rate: percent("Tingkat diskonto"),
      fuel_price_escalation_annual: percent("Perubahan harga diesel"),
      additional_project_cost: { label: "Biaya proyek tambahan", min: 0 },
    });
  });

/* ------------------------------------------------------------------------ */
/* Card 07 · Reliability & optimization                                      */
/* ------------------------------------------------------------------------ */

export const reliabilitySchema = z
  .object({
    target_supply_fraction: z.string(),
    shortage_policy: z.enum(["forbid", "bounded"]),
    max_unmet_energy_fraction: z.string(),
    reserve_margin_fraction: z.string(),
  })
  .superRefine((data, ctx) => {
    checkNumbers(ctx, data, {
      target_supply_fraction: percent("Target pemenuhan kebutuhan"),
      max_unmet_energy_fraction:
        data.shortage_policy === "bounded"
          ? percent("Maksimum energi tak terpenuhi")
          : undefined,
      reserve_margin_fraction: percent("Cadangan daya"),
    });
  });

export const optimizationSchema = z.object({
  objective: z.enum(["annualized_cost", "fuel_consumption"]),
  scenarios: z
    .array(z.enum(SCENARIO_IDS))
    .min(1, "Pilih minimal satu skenario"),
});

/* ------------------------------------------------------------------------ */

export const simulationFormSchema = z
  .object({
    project: projectSchema,
    demand: demandSchema,
    pv: pvSchema,
    generators: generatorsSchema,
    battery: batterySchema,
    economics: economicsSchema,
    reliability: reliabilitySchema,
    optimization: optimizationSchema,
  })
  .superRefine((data, ctx) => {
    const needsPv = data.optimization.scenarios.some(
      (id) => id !== "diesel_only",
    );
    if (needsPv && !data.pv.enabled) {
      ctx.addIssue({
        code: "custom",
        path: ["optimization", "scenarios"],
        message: "Skenario dengan PV butuh panel surya yang aktif (card 03)",
      });
    }
  });

export type SimulationFormValues = z.infer<typeof simulationFormSchema>;
export type SimulationFormSection = keyof SimulationFormValues;
export type DemandLoadFormValues = z.infer<typeof demandLoadSchema>;
export type ScenarioId = (typeof SCENARIO_IDS)[number];
