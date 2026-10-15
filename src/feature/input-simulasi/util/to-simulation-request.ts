import type {
  ScenarioKey,
  SimulationRequest,
} from "@/repository/simulation/dto";
import {
  parseDieselCapacity,
  type SimulationFormValues,
} from "@/schemas/simulation/simulation.schema";
import { parseIdNumber } from "@/shared/util/number";

const JUTA = 1_000_000;

const optionalNumber = (raw: string) =>
  raw === "" ? null : parseIdNumber(raw);

/** Ubah nilai form (string format Indonesia) menjadi payload API. */
export const toSimulationRequest = (
  values: SimulationFormValues,
): SimulationRequest => {
  const { lokasi, kebutuhan, parameter, biaya } = values;
  const diesel = parseDieselCapacity(parameter.diesel_kapasitas);

  if (!diesel) {
    throw new Error("Format kapasitas diesel tidak valid");
  }

  const scenarios: ScenarioKey[] = [];
  if (biaya.skenario_baseline) scenarios.push("baseline");
  if (biaya.skenario_hybrid) scenarios.push("hybrid");

  return {
    location: {
      village_name: lokasi.nama_desa.trim(),
      province: lokasi.provinsi,
      timezone: lokasi.zona_waktu,
      latitude: optionalNumber(lokasi.latitude),
      longitude: optionalNumber(lokasi.longitude),
    },
    load:
      kebutuhan.mode === "contoh"
        ? { source: "preset", preset_id: kebutuhan.preset_id }
        : {
            source: "manual",
            daily_energy_kwh: parseIdNumber(kebutuhan.energi_harian),
            peak_load_kw: parseIdNumber(kebutuhan.daya_puncak),
            profile_file_name: kebutuhan.profil_file?.name ?? null,
          },
    diesel: {
      units: diesel.units,
      unit_capacity_kw: diesel.unitCapacityKw,
      min_load_pct: parseIdNumber(parameter.diesel_min_load),
      specific_consumption_l_per_kwh: parseIdNumber(parameter.diesel_konsumsi),
    },
    pv: {
      max_capacity_kwp: parseIdNumber(parameter.pv_maks),
      avg_irradiance_kwh_m2_day: parseIdNumber(parameter.pv_radiasi),
      lifetime_years: parseIdNumber(parameter.pv_umur),
    },
    battery: {
      max_capacity_kwh: parseIdNumber(parameter.baterai_maks),
      min_soc_pct: parseIdNumber(parameter.baterai_soc_min),
      round_trip_efficiency_pct: parseIdNumber(parameter.baterai_efisiensi),
    },
    economics: {
      capex_pv_idr_per_kwp: parseIdNumber(biaya.capex_pv) * JUTA,
      capex_battery_idr_per_kwh: parseIdNumber(biaya.capex_baterai) * JUTA,
      capex_inverter_idr_per_kw: parseIdNumber(biaya.capex_inverter) * JUTA,
      diesel_price_idr_per_liter: parseIdNumber(biaya.harga_solar),
      project_lifetime_years: parseIdNumber(biaya.umur_proyek),
      discount_rate_pct: parseIdNumber(biaya.diskonto),
      usd_idr_rate: parseIdNumber(biaya.kurs),
    },
    scenarios,
    max_unserved_energy_pct: parseIdNumber(biaya.batas_unserved),
  };
};
