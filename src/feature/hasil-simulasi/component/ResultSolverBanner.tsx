import { IconCircleCheck } from "@tabler/icons-react";
import type { SimulationResult } from "@/repository/simulation/dto";
import StatusBanner from "@/shared/component/StatusBanner";
import { formatNumber } from "@/shared/util/number";
import { SCENARIO_META } from "../data";

interface ResultSolverBannerProps {
  result: SimulationResult;
}

const ResultSolverBanner = ({ result }: ResultSolverBannerProps) => {
  const { solver, scenarios } = result;
  const durations = scenarios
    .map(
      (scenario) =>
        `${SCENARIO_META[scenario.key].name} ${formatNumber(scenario.solve_seconds, 1, 1)} detik`,
    )
    .join(" · ");

  return (
    <StatusBanner
      icon={IconCircleCheck}
      iconClassName="text-success"
      title={`Solver: ${solver.model_status.toLowerCase()} (${scenarios.length} dari ${scenarios.length} skenario)`}
      titleClassName="text-success"
      description={`${durations}. Neraca energi lolos di ${formatNumber(solver.periods)} jam (selisih maks ${formatNumber(result.energy_balance_max_error_kwh, 2, 2)} kWh).`}
      meta={`${solver.name} ${solver.version} · Model status: ${solver.model_status} · ${solver.method} · ${formatNumber(solver.periods)} periode`}
    />
  );
};

export default ResultSolverBanner;
