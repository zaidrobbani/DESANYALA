import type { SimulationRequest } from "@/repository/simulation/dto";
import type { SimulationFormValues } from "@/schemas/simulation/simulation.schema";
import { formatNumber } from "@/shared/util/number";

/*
 * Kebalikan `toSimulationRequest`: payload run sebelumnya -> nilai form,
 * dipakai untuk mengisi ulang input dari halaman Hasil/Proses
 * (`/simulasi?dari=<id>`).
 */

/** Number -> string gaya Indonesia yang bisa dibaca `parseIdNumber`. */
const str = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? ""
    : formatNumber(value, 6);

/** Pecahan 0..1 -> persen di UI, tanpa sisa floating point (0.995 -> "99,5"). */
const pct = (value: number) => str(Math.round(value * 100 * 1e6) / 1e6);

export const fromSimulationRequest = (
  request: SimulationRequest,
): SimulationFormValues => {
  const {
    project,
    demand,
    pv,
    generators,
    battery,
    economics,
    reliability,
    optimization,
  } = request;

  return {
    project: {
      name: project.name,
      location: project.location,
      households: str(project.households),
      electrification_status: project.electrification_status,
      simulation_days: String(
        project.simulation_days,
      ) as SimulationFormValues["project"]["simulation_days"],
      project_lifetime_years: str(project.project_lifetime_years),
      currency: project.currency,
    },
    demand: {
      loads: demand.loads.map((load) => ({
        category: load.category,
        device: load.device,
        quantity: str(load.quantity),
        power_w: str(load.power_w),
        hours_per_day: str(load.hours_per_day),
      })),
    },
    pv: {
      enabled: pv.enabled,
      // Kosong bila sama dengan lokasi proyek (fallback di mapper).
      resource_location:
        pv.resource_location === project.location ? "" : pv.resource_location,
      peak_sun_hours_estimate: str(pv.peak_sun_hours_estimate),
      system_performance_factor: pct(pv.system_performance_factor),
      capacity_mode: pv.capacity_mode,
      fixed_capacity_kwp: str(pv.fixed_capacity_kwp),
      capacity_min_kwp: str(pv.capacity_min_kwp),
      capacity_max_kwp: str(pv.capacity_max_kwp),
      capex_per_kwp: str(pv.capex_per_kwp),
      opex_annual_per_kwp: str(pv.opex_annual_per_kwp),
      lifetime_years: str(pv.lifetime_years),
    },
    generators: {
      mode: generators.mode,
      unit_count: str(generators.unit_count),
      rated_power_each_kw: str(generators.rated_power_each_kw),
      min_loading_fraction: pct(generators.min_loading_fraction),
      max_loading_fraction: pct(generators.max_loading_fraction),
      fuel_price_per_liter: str(generators.fuel_price_per_liter),
      fuel_model: generators.fuel_model,
      efficiency_fraction: pct(generators.efficiency_fraction),
      capex_per_kw: str(generators.capex_per_kw),
      opex_annual_per_unit: str(generators.opex_annual_per_unit),
      lifetime_years: str(generators.lifetime_years),
    },
    battery: {
      enabled: battery.enabled,
      capacity_min_kwh: str(battery.capacity_min_kwh),
      capacity_max_kwh: str(battery.capacity_max_kwh),
      power_max_kw: str(battery.power_max_kw),
      charge_efficiency: pct(battery.charge_efficiency),
      discharge_efficiency: pct(battery.discharge_efficiency),
      soc_min_fraction: pct(battery.soc_min_fraction),
      soc_max_fraction: pct(battery.soc_max_fraction),
      soc_initial_fraction: pct(battery.soc_initial_fraction),
      capex_per_kwh: str(battery.capex_per_kwh),
      power_capex_per_kw: str(battery.power_capex_per_kw),
      lifetime_years: str(battery.lifetime_years),
    },
    economics: {
      discount_rate: pct(economics.discount_rate),
      fuel_price_escalation_annual: pct(economics.fuel_price_escalation_annual),
      additional_project_cost: str(economics.additional_project_cost),
    },
    reliability: {
      target_supply_fraction: pct(reliability.target_supply_fraction),
      shortage_policy: reliability.shortage_policy,
      max_unmet_energy_fraction: pct(reliability.max_unmet_energy_fraction),
      reserve_margin_fraction: pct(reliability.reserve_margin_fraction),
    },
    optimization: {
      objective: optimization.objective,
      scenarios: optimization.scenarios.map(({ id }) => id),
    },
  };
};
