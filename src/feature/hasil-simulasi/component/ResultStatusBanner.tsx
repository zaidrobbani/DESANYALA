import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import type { OptimizationResponse } from "@/repository/simulation/dto";
import StatusBanner from "@/shared/component/StatusBanner";
import { formatNumber } from "@/shared/util/number";
import { isUsableScenario } from "../util/result-view";

interface ResultStatusBannerProps {
  response: OptimizationResponse;
}

/**
 * Status solver dipisah dari status validasi (sesuai catatan referensi):
 * hasil hanya disebut optimal bila solver optimal DAN semua cek lolos.
 */
const ResultStatusBanner = ({ response }: ResultStatusBannerProps) => {
  const total = response.scenario_results.length;
  const usable = response.scenario_results.filter(isUsableScenario).length;
  const { validation } = response;
  const checks = [
    validation.energy_balance_passed,
    validation.reliability_passed,
    validation.capacity_constraints_passed,
  ];
  const validationFailed = checks.some((check) => check === false);
  const validationPending = checks.some((check) => check === null);

  let icon = IconCircleCheck;
  let tone = "text-success";
  let title = `Solver ${response.status} · ${usable} dari ${total} skenario punya solusi`;
  if (usable === 0) {
    icon = IconCircleX;
    tone = "text-danger";
    title = `Solver ${response.status} · tidak ada skenario yang punya solusi`;
  } else if (
    usable < total ||
    response.status !== "optimal" ||
    validationFailed ||
    validationPending
  ) {
    icon = IconAlertTriangle;
    tone = "text-warning";
  }

  const description = [
    validationFailed
      ? "Ada pemeriksaan validasi yang gagal; audit sebelum memakai hasil."
      : validationPending
        ? "Sebagian pemeriksaan validasi tidak dilakukan."
        : "Pemeriksaan keseimbangan energi, keandalan, dan batas kapasitas lolos.",
    `Satuan biaya ${response.units.lcoe} mengikuti mata uang proyek.`,
  ].join(" ");

  const generatedAt = new Date(response.generated_at);

  return (
    <StatusBanner
      icon={icon}
      iconClassName={tone}
      title={title}
      titleClassName={tone}
      description={description}
      meta={[
        `run ${response.project_id}`,
        `${formatNumber(response.period_days)} hari × ${formatNumber(24 / response.time_step_hours)} interval/hari`,
        `${formatNumber(response.warnings.length)} catatan`,
        Number.isNaN(generatedAt.getTime())
          ? null
          : generatedAt.toLocaleString("id-ID"),
      ]
        .filter(Boolean)
        .join(" · ")}
    />
  );
};

export default ResultStatusBanner;
