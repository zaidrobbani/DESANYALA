import { z } from "zod";
import { parseIdNumber } from "@/shared/util/number";

/*
 * Semua field angka disimpan sebagai string di form (format Indonesia:
 * "17.100", "0,28") supaya input tidak "lompat" saat diketik.
 * Konversi ke number dilakukan di mapper `toSimulationRequest`.
 */

type NumberRule = {
  min?: number;
  max?: number;
  /** Batas bawah eksklusif (nilai harus > gt). */
  gt?: number;
  integer?: boolean;
};

const numberField = (label: string, rule: NumberRule = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .superRefine((raw, ctx) => {
      const value = parseIdNumber(raw);
      if (Number.isNaN(value)) {
        ctx.addIssue({ code: "custom", message: "Format angka tidak valid" });
        return;
      }
      if (rule.integer && !Number.isInteger(value)) {
        ctx.addIssue({
          code: "custom",
          message: `${label} harus bilangan bulat`,
        });
      }
      if (rule.gt !== undefined && value <= rule.gt) {
        ctx.addIssue({
          code: "custom",
          message: `${label} harus lebih dari ${rule.gt}`,
        });
      }
      if (rule.min !== undefined && value < rule.min) {
        ctx.addIssue({
          code: "custom",
          message: `${label} minimal ${rule.min}`,
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        ctx.addIssue({
          code: "custom",
          message: `${label} maksimal ${rule.max}`,
        });
      }
    });

const optionalCoordinate = (label: string, limit: number) =>
  z
    .string()
    .trim()
    .superRefine((raw, ctx) => {
      if (raw === "") return;
      const value = parseIdNumber(raw);
      if (Number.isNaN(value)) {
        ctx.addIssue({ code: "custom", message: "Format angka tidak valid" });
      } else if (Math.abs(value) > limit) {
        ctx.addIssue({
          code: "custom",
          message: `${label} harus di antara -${limit} dan ${limit}`,
        });
      }
    });

/** Format kapasitas genset: "<jumlah unit> × <kW per unit>", mis. "2 × 80". */
export const DIESEL_CAPACITY_PATTERN =
  /^\s*(\d+)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*$/i;

export const parseDieselCapacity = (raw: string) => {
  const match = DIESEL_CAPACITY_PATTERN.exec(raw);
  if (!match) return null;
  const units = Number(match[1]);
  const unitCapacityKw = parseIdNumber(match[2]);
  if (!units || Number.isNaN(unitCapacityKw) || unitCapacityKw <= 0) {
    return null;
  }
  return { units, unitCapacityKw };
};

export const LOAD_PROFILE_ACCEPT = ".csv,.xlsx";
export const LOAD_PROFILE_MAX_SIZE = 5 * 1024 * 1024;

export const lokasiSchema = z
  .object({
    nama_desa: z.string().trim().min(1, "Nama desa wajib diisi").max(120),
    provinsi: z.string().min(1, "Provinsi wajib dipilih"),
    zona_waktu: z.enum(["WIB", "WITA", "WIT"], "Zona waktu wajib dipilih"),
    latitude: optionalCoordinate("Latitude", 90),
    longitude: optionalCoordinate("Longitude", 180),
  })
  .superRefine((data, ctx) => {
    const hasLat = data.latitude !== "";
    const hasLng = data.longitude !== "";
    if (hasLat && !hasLng) {
      ctx.addIssue({
        code: "custom",
        path: ["longitude"],
        message: "Isi longitude juga, atau kosongkan keduanya",
      });
    }
    if (hasLng && !hasLat) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Isi latitude juga, atau kosongkan keduanya",
      });
    }
  });

export const kebutuhanSchema = z
  .object({
    mode: z.enum(["contoh", "manual"]),
    preset_id: z.string(),
    energi_harian: z.string().trim(),
    daya_puncak: z.string().trim(),
    profil_file: z.custom<File | null>(
      (value) => value === null || value instanceof File,
    ),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "contoh") {
      if (!data.preset_id) {
        ctx.addIssue({
          code: "custom",
          path: ["preset_id"],
          message: "Pilih salah satu profil contoh",
        });
      }
      return;
    }

    const check = (
      key: "energi_harian" | "daya_puncak",
      label: string,
      max: number,
    ) => {
      const result = numberField(label, { gt: 0, max }).safeParse(data[key]);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: result.error.issues[0]?.message ?? "Tidak valid",
        });
      }
      return result.success ? parseIdNumber(data[key]) : null;
    };

    const energy = check("energi_harian", "Total energi harian", 100_000);
    const peak = check("daya_puncak", "Daya puncak", 10_000);

    // Rata-rata beban (energi / 24 jam) tidak mungkin melebihi beban puncak.
    if (energy !== null && peak !== null && energy / 24 > peak) {
      ctx.addIssue({
        code: "custom",
        path: ["daya_puncak"],
        message:
          "Daya puncak lebih kecil dari beban rata-rata (energi ÷ 24 jam)",
      });
    }

    const file = data.profil_file;
    if (file) {
      const name = file.name.toLowerCase();
      if (!name.endsWith(".csv") && !name.endsWith(".xlsx")) {
        ctx.addIssue({
          code: "custom",
          path: ["profil_file"],
          message: "Format file harus .csv atau .xlsx",
        });
      } else if (file.size > LOAD_PROFILE_MAX_SIZE) {
        ctx.addIssue({
          code: "custom",
          path: ["profil_file"],
          message: "Ukuran file maksimal 5 MB",
        });
      }
    }
  });

export const parameterSchema = z.object({
  diesel_kapasitas: z
    .string()
    .trim()
    .min(1, "Kapasitas terpasang wajib diisi")
    .refine((raw) => parseDieselCapacity(raw) !== null, {
      message: "Gunakan format jumlah × kW, mis. 2 × 80",
    }),
  diesel_min_load: numberField("Minimum load", { min: 0, max: 100 }),
  diesel_konsumsi: numberField("Konsumsi spesifik", { gt: 0, max: 2 }),
  pv_maks: numberField("Kapasitas PV", { min: 0, max: 100_000 }),
  pv_radiasi: numberField("Radiasi", { gt: 0, max: 12 }),
  pv_umur: numberField("Umur PV", { min: 1, max: 50, integer: true }),
  baterai_maks: numberField("Kapasitas baterai", { min: 0, max: 100_000 }),
  baterai_soc_min: numberField("SOC minimum", { min: 0, max: 95 }),
  baterai_efisiensi: numberField("Efisiensi", { gt: 0, max: 100 }),
});

export const biayaSchema = z
  .object({
    capex_pv: numberField("CAPEX panel surya", { min: 0 }),
    capex_baterai: numberField("CAPEX baterai", { min: 0 }),
    capex_inverter: numberField("CAPEX inverter", { min: 0 }),
    harga_solar: numberField("Harga solar", { gt: 0 }),
    umur_proyek: numberField("Umur proyek", { min: 1, max: 50, integer: true }),
    diskonto: numberField("Tingkat diskonto", { min: 0, max: 100 }),
    kurs: numberField("Kurs", { gt: 0 }),
    skenario_baseline: z.boolean(),
    skenario_hybrid: z.boolean(),
    batas_unserved: numberField("Batas beban tak terlayani", {
      min: 0,
      max: 100,
    }),
  })
  .refine((data) => data.skenario_baseline || data.skenario_hybrid, {
    path: ["skenario_hybrid"],
    message: "Pilih minimal satu skenario",
  });

export const simulationFormSchema = z.object({
  lokasi: lokasiSchema,
  kebutuhan: kebutuhanSchema,
  parameter: parameterSchema,
  biaya: biayaSchema,
});

export type SimulationFormValues = z.infer<typeof simulationFormSchema>;
export type SimulationSectionKey = keyof SimulationFormValues;
