import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { SimulationProgress } from "@/repository/simulation/dto";
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
    return {
      icon: IconAlertTriangle,
      iconClass: "text-danger",
      titleClass: "text-danger",
      title: `Optimasi gagal pada ${scenarioCount}`,
      description:
        progress.error?.message ?? "Solver berhenti karena terjadi kesalahan.",
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

/**
 * Status solver: panel putih, ikon + judul berwarna, log apa adanya
 * (Code/Small). Tanpa latar tint dan garis aksen.
 */
const SolverBanner = ({ progress }: SolverBannerProps) => {
  const content = resolveContent(progress);
  const { solver } = progress;

  return (
    <section
      aria-live="polite"
      className="flex w-full items-start gap-3 rounded-md bg-surface px-4 py-3.5"
    >
      <content.icon
        aria-hidden
        className={cn("mt-0.5 size-[18px] shrink-0", content.iconClass)}
        stroke={1.75}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className={cn("text-body-strong", content.titleClass)}>
          {content.title}
        </h2>
        <p className="text-fg-primary text-small">{content.description}</p>
        <p className="font-mono text-code text-fg-tertiary">
          {solver.name} {solver.version} · {solver.method} ·{" "}
          {formatNumber(solver.periods)} periode ·{" "}
          {formatDuration(progress.elapsed_seconds)}
        </p>
      </div>
    </section>
  );
};

export default SolverBanner;
