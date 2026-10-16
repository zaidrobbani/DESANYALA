import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
} from "@tabler/icons-react";
import type { SimulationProgress } from "@/repository/simulation/dto";
import StatusBanner from "@/shared/component/StatusBanner";
import { formatDuration, formatNumber } from "@/shared/util/number";
import { SCENARIO_DONE_PREFIX, SCENARIO_RUNNING_DESCRIPTION } from "../data";

type BannerContent = {
  icon: typeof IconLoader2;
  iconClass: string;
  titleClass: string;
  title: string;
  description: string;
};

const resolveContent = (progress: SimulationProgress): BannerContent => {
  const {
    status,
    current_scenario_index: current,
    total_scenarios: total,
  } = progress;
  const scenarioCount = `skenario ${current} dari ${total}`;

  if (status === "completed") {
    return {
      icon: IconCircleCheck,
      iconClass: "text-success",
      titleClass: "text-success",
      title: "Optimasi selesai",
      description: "Semua skenario optimal. Mengalihkan ke halaman Hasil…",
    };
  }

  if (status === "failed") {
    const message =
      progress.error?.message ?? "Solver berhenti karena terjadi kesalahan.";
    const hasPartialResult = progress.scenarios.some(
      (scenario) => scenario.status === "optimal",
    );
    return {
      icon: IconAlertTriangle,
      iconClass: "text-danger",
      titleClass: "text-danger",
      title: `Optimasi gagal pada ${scenarioCount}`,
      description: hasPartialResult
        ? `${message} Mengalihkan ke halaman Hasil untuk diagnosis…`
        : message,
    };
  }

  if (status === "cancelled") {
    return {
      icon: IconCircleX,
      iconClass: "text-fg-secondary",
      titleClass: "text-fg-secondary",
      title: "Optimasi dibatalkan",
      description: "Solver dihentikan. Ubah input lalu jalankan ulang.",
    };
  }

  const running = progress.scenarios[current - 1];
  const finished = progress.scenarios
    .filter((scenario) => scenario.status === "optimal")
    .map((scenario) => SCENARIO_DONE_PREFIX[scenario.key]);

  return {
    icon: IconLoader2,
    iconClass: "animate-spin text-brand",
    titleClass: "text-brand",
    title:
      status === "queued"
        ? "Menunggu antrean solver"
        : `Sedang diproses: ${scenarioCount}`,
    description: [
      ...finished,
      running ? SCENARIO_RUNNING_DESCRIPTION[running.key] : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
};

interface SolverBannerProps {
  progress: SimulationProgress;
}

const SolverBanner = ({ progress }: SolverBannerProps) => {
  const content = resolveContent(progress);
  const { solver } = progress;

  return (
    <StatusBanner
      icon={content.icon}
      iconClassName={content.iconClass}
      title={content.title}
      titleClassName={content.titleClass}
      description={content.description}
      meta={
        <>
          {solver.name} {solver.version} · {solver.method} ·{" "}
          {formatNumber(solver.periods)} periode ·{" "}
          {formatDuration(progress.elapsed_seconds)}
        </>
      }
    />
  );
};

export default SolverBanner;
