import type { SimulationRequest } from "@/repository/simulation/dto";
import type { SimulationFormValues } from "@/schemas/simulation/simulation.schema";
import { formatNumber } from "@/shared/util/number";
import { DEFAULT_PRESET_ID, SIMULATION_FORM_DEFAULTS } from "../data";

const JUTA = 1_000_000;

/** Angka ke string form gaya Indonesia, tanpa membuang presisi. */
const toField = (value: number) => formatNumber(value, 6);

const optionalField = (value: number | null) =>
  value === null ? "" : toField(value);

/**
 * Kebalikan `toSimulationRequest`: isi form dari input run sebelumnya.
 * File profil beban tidak bisa dipulihkan, jadi `profil_file` selalu null.
 */
export const fromSimulationRequest = (
  request: SimulationRequest,
): SimulationFormValues => {
  const { location, load, diesel, pv, battery, economics } = request;

  return {
    lokasi: {
      nama_desa: location.village_name,
      provinsi: location.province,
      zona_waktu: location.timezone,
      latitude: optionalField(location.latitude),
      longitude: optionalField(location.longitude),
    },
    kebutuhan:
      load.source === "preset"
        ? {
            ...SIMULATION_FORM_DEFAULTS.kebutuhan,
            mode: "contoh",
            preset_id: load.preset_id,
          }
        : {
            mode: "manual",
            preset_id: DEFAULT_PRESET_ID,
            energi_harian: toField(load.daily_energy_kwh),
            daya_puncak: toField(load.peak_load_kw),
            profil_file: null,
          },
    parameter: {
      diesel_kapasitas: `${diesel.units} × ${toField(diesel.unit_capacity_kw)}`,
      diesel_min_load: toField(diesel.min_load_pct),
      diesel_konsumsi: toField(diesel.specific_consumption_l_per_kwh),
      pv_maks: toField(pv.max_capacity_kwp),
      pv_radiasi: toField(pv.avg_irradiance_kwh_m2_day),
      pv_umur: toField(pv.lifetime_years),
      baterai_maks: toField(battery.max_capacity_kwh),
      baterai_soc_min: toField(battery.min_soc_pct),
      baterai_efisiensi: toField(battery.round_trip_efficiency_pct),
    },
    biaya: {
      capex_pv: toField(economics.capex_pv_idr_per_kwp / JUTA),
      capex_baterai: toField(economics.capex_battery_idr_per_kwh / JUTA),
      capex_inverter: toField(economics.capex_inverter_idr_per_kw / JUTA),
      harga_solar: toField(economics.diesel_price_idr_per_liter),
      umur_proyek: toField(economics.project_lifetime_years),
      diskonto: toField(economics.discount_rate_pct),
      kurs: toField(economics.usd_idr_rate),
      skenario_baseline: request.scenarios.includes("baseline"),
      skenario_hybrid: request.scenarios.includes("hybrid"),
      batas_unserved: toField(request.max_unserved_energy_pct),
    },
  };
};
