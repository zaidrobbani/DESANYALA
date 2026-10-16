import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
} from "@tabler/icons-react";
import type { SimulationProgress } from "@/repository/simulation/dto";
import StatusBanner from "@/shared/component/StatusBanner";
import { formatDuration, formatNumber } from "@/shared/util/number";
import { RUNNING_DESCRIPTION } from "../data";

type BannerContent = {
  icon: typeof IconLoader2;
  iconClass: string;
  titleClass: string;
  title: string;
  description: string;
};

const countByStatus = (progress: SimulationProgress) => {
  const usable = progress.scenarios.filter(
    (s) => s.status === "optimal" || s.status === "feasible",
  ).length;
  return { usable, total: progress.total_scenarios };
};

const resolveContent = (progress: SimulationProgress): BannerContent => {
  const { status } = progress;
  const { usable, total } = countByStatus(progress);

  if (status === "completed") {
    return {
      icon: IconCircleCheck,
      iconClass: "text-success",
      titleClass: "text-success",
      title: "Optimasi selesai",
      description: `${usable} dari ${total} skenario punya solusi. Mengalihkan ke halaman Hasil…`,
    };
  }

  if (status === "failed") {
    const message =
      progress.error?.message ?? "Solver berhenti karena terjadi kesalahan.";
    return {
      icon: IconAlertTriangle,
      iconClass: "text-danger",
      titleClass: "text-danger",
      title:
        usable > 0
          ? `Sebagian skenario gagal (${usable} dari ${total} berhasil)`
          : "Optimasi gagal",
      description:
        usable > 0
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
      description:
        "Request dihentikan dari browser. Ubah input lalu jalankan ulang.",
    };
  }

  return {
    icon: IconLoader2,
    iconClass: "animate-spin text-brand",
    titleClass: "text-brand",
    title:
      status === "queued"
        ? "Menunggu antrean solver"
        : `Sedang diproses: ${total} skenario`,
    description: RUNNING_DESCRIPTION,
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
          {solver.name} · {solver.method} · {formatNumber(solver.periods)}{" "}
          periode · {formatDuration(progress.elapsed_seconds)}
        </>
      }
    />
  );
};

export default SolverBanner;
