import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import type {
  OptimizationResponse,
  RunError,
  RunSource,
} from "@/repository/simulation/dto";
import StatusBanner from "@/shared/component/StatusBanner";
import { formatNumber } from "@/shared/util/number";
import { isUsableScenario } from "../util/result-view";

interface ResultStatusBannerProps {
  response: OptimizationResponse;
  source: RunSource;
  /** Error backend yang membuat run ini beralih ke mock FE. */
  fallback: RunError | null;
}

/**
 * Status solver dipisah dari status validasi (sesuai catatan referensi):
 * hasil hanya disebut optimal bila solver optimal DAN semua cek lolos.
 * Hasil mock FE selalu ditandai supaya tidak dikira keluaran Offgridders.
 */
const ResultStatusBanner = ({
  response,
  source,
  fallback,
}: ResultStatusBannerProps) => {
  const isMock = source !== "backend";
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

  const solverLabel = isMock ? "Mock FE" : `Solver ${response.status}`;
  let icon = IconCircleCheck;
  let tone = "text-success";
  let title = `${solverLabel} · ${usable} dari ${total} skenario punya solusi`;
  if (usable === 0) {
    icon = IconCircleX;
    tone = "text-danger";
    title = `${solverLabel} · tidak ada skenario yang punya solusi`;
  } else if (
    isMock ||
    usable < total ||
    response.status !== "optimal" ||
    validationFailed ||
    validationPending
  ) {
    icon = IconAlertTriangle;
    tone = "text-warning";
  }

  const description = [
    fallback
      ? `Backend gagal (${fallback.code}), jadi hasil ini dihitung mock FE di browser, bukan Offgridders. Jangan dipakai sebagai hasil akhir.`
      : isMock
        ? "Mode mock: angka dihitung heuristik di browser, bukan Offgridders."
        : null,
    validationFailed
      ? "Ada pemeriksaan validasi yang gagal; audit sebelum memakai hasil."
      : validationPending
        ? "Sebagian pemeriksaan validasi tidak dilakukan."
        : "Pemeriksaan keseimbangan energi, keandalan, dan batas kapasitas lolos.",
    `Satuan biaya ${response.units.lcoe} mengikuti mata uang proyek.`,
  ]
    .filter(Boolean)
    .join(" ");

  const generatedAt = new Date(response.generated_at);

  return (
    <StatusBanner
      icon={icon}
      iconClassName={tone}
      title={title}
      titleClassName={tone}
      description={description}
      meta={[
        fallback && `backend: ${fallback.message}`,
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
