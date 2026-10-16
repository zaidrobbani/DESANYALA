import { IconScale } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type {
  OptimizationResponse,
  ScenarioKey,
} from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import SourceBadge from "@/shared/component/SourceBadge";
import { formatNumber, formatPercent } from "@/shared/util/number";
import { RUN_STATUS_META, SCENARIO_META, SCENARIO_ORDER } from "../data";
import { isUsableScenario } from "../util/result-view";

const num = (value: number | null, digits = 2, unit = "") =>
  value === null ? "—" : `${formatNumber(value, digits)}${unit}`;

interface PerbandinganSectionProps {
  response: OptimizationResponse;
  selected: ScenarioKey | null;
  onSelect: (key: ScenarioKey) => void;
}

const HEAD_CLASS =
  "whitespace-nowrap px-3 py-2.5 text-left font-normal text-fg-tertiary text-small first:pl-0";
const CELL_CLASS = "whitespace-nowrap px-3 py-3 text-num-sm first:pl-0";

/** Tabel perbandingan skenario (#comparisonBody di referensi). */
const PerbandinganSection = ({
  response,
  selected,
  onSelect,
}: PerbandinganSectionProps) => {
  const { units } = response;

  return (
    <SectionCard
      icon={IconScale}
      title="Perbandingan skenario"
      description="Angka tahunan dari setiap skenario yang dijalankan."
    >
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-line border-b">
              <th scope="col" className={HEAD_CLASS}>
                Skenario
              </th>
              <th scope="col" className={HEAD_CLASS}>
                LCOE ({units.lcoe})
              </th>
              <th scope="col" className={HEAD_CLASS}>
                Biaya tahunan ({units.currency})
              </th>
              <th scope="col" className={HEAD_CLASS}>
                PV
              </th>
              <th scope="col" className={HEAD_CLASS}>
                Baterai
              </th>
              <th scope="col" className={HEAD_CLASS}>
                Genset
              </th>
              <th scope="col" className={HEAD_CLASS}>
                Diesel / tahun
              </th>
              <th scope="col" className={HEAD_CLASS}>
                Energi terbarukan
              </th>
            </tr>
          </thead>
          <tbody>
            {SCENARIO_ORDER.map((key) => {
              const meta = SCENARIO_META[key];
              const scenario = response.scenario_results.find(
                (s) => s.scenario_id === key,
              );
              const usable = scenario ? isUsableScenario(scenario) : false;
              const status = scenario ? RUN_STATUS_META[scenario.status] : null;
              const m = scenario?.metrics;
              const c = scenario?.capacities;

              return (
                <tr
                  key={key}
                  className={cn(
                    "border-line border-b last:border-b-0",
                    selected === key && "bg-brand-subtle/60",
                  )}
                >
                  <td className={cn(CELL_CLASS, "font-sans")}>
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          scenario ? meta.swatchClass : "bg-track",
                        )}
                      />
                      {scenario ? (
                        <button
                          type="button"
                          onClick={() => onSelect(key)}
                          className="text-body-strong underline-offset-4 hover:underline"
                        >
                          {meta.label}
                        </button>
                      ) : (
                        <span className="text-body-strong text-fg-tertiary">
                          {meta.label}
                        </span>
                      )}
                      {status ? (
                        <SourceBadge tone={status.tone}>
                          {status.label}
                        </SourceBadge>
                      ) : (
                        <SourceBadge tone="neutral">
                          Tidak dijalankan
                        </SourceBadge>
                      )}
                    </div>
                  </td>
                  {usable && m && c ? (
                    <>
                      <td className={CELL_CLASS}>
                        {num(m.lcoe, (m.lcoe ?? 0) < 10 ? 5 : 2)}
                      </td>
                      <td className={CELL_CLASS}>
                        {num(m.annualized_cost, 0)}
                      </td>
                      <td className={CELL_CLASS}>{num(c.pv_kwp, 2, " kWp")}</td>
                      <td className={CELL_CLASS}>
                        {num(c.battery_kwh, 2, " kWh")}
                      </td>
                      <td className={CELL_CLASS}>
                        {num(c.genset_kw, 2, " kW")}
                      </td>
                      <td className={CELL_CLASS}>
                        {num(m.annual_fuel_liters, 0, " L")}
                      </td>
                      <td className={CELL_CLASS}>
                        {m.renewable_share_fraction === null
                          ? "—"
                          : formatPercent(m.renewable_share_fraction * 100, 2)}
                      </td>
                    </>
                  ) : (
                    <td
                      colSpan={7}
                      className={cn(CELL_CLASS, "font-sans text-fg-tertiary")}
                    >
                      {scenario
                        ? "Tidak ada solusi; angka sengaja tidak ditampilkan."
                        : "Skenario tidak dipilih di input."}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-fg-tertiary text-small">
        Satuan LCOE dan biaya mengikuti mata uang proyek dari backend (
        {units.currency}). Skenario infeasible/error tidak dibandingkan.
      </p>
    </SectionCard>
  );
};

export default PerbandinganSection;
