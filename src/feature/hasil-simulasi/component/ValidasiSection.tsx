import {
  IconCircleCheck,
  IconCircleDashed,
  IconCircleX,
  IconListCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type {
  OptimizationUnits,
  ScenarioResult,
} from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import { formatNumber } from "@/shared/util/number";

const CHECKS = [
  { key: "energy_balance_passed", label: "Keseimbangan energi" },
  { key: "reliability_passed", label: "Keandalan / shortage" },
  { key: "capacity_constraints_passed", label: "Batas kapasitas input" },
] as const;

const CheckIcon = ({ passed }: { passed: boolean | null }) => {
  if (passed === null) {
    return (
      <IconCircleDashed
        aria-hidden
        className="size-4 shrink-0 text-fg-tertiary"
        stroke={1.75}
      />
    );
  }
  const Icon = passed ? IconCircleCheck : IconCircleX;
  return (
    <Icon
      aria-hidden
      className={cn("size-4 shrink-0", passed ? "text-success" : "text-danger")}
      stroke={1.75}
    />
  );
};

const checkLabel = (passed: boolean | null) =>
  passed === null ? "Tidak diperiksa" : passed ? "Lolos" : "Gagal";

interface ValidasiSectionProps {
  scenario: ScenarioResult;
  units: OptimizationUnits;
  /** Jumlah interval yang diharapkan (hari × 24 / langkah waktu). */
  expectedIntervals: number;
}

/** Validasi hasil (#validationStatus, #shortageCheck, #periodCheck, #annuityValue). */
const ValidasiSection = ({
  scenario,
  units,
  expectedIntervals,
}: ValidasiSectionProps) => {
  const { validation, metrics, dispatch } = scenario;
  const allPassed = CHECKS.every(({ key }) => validation[key] === true);

  const rows = [
    {
      label: "Energi tak terpenuhi",
      value:
        metrics.annual_unmet_energy_kwh === null
          ? "—"
          : `${formatNumber(metrics.annual_unmet_energy_kwh, 2)} kWh`,
    },
    {
      label: "Interval profil output",
      value: `${formatNumber(dispatch.length)} dari ${formatNumber(expectedIntervals)}`,
    },
    {
      label: "Biaya tahunan (annuity)",
      value:
        metrics.annualized_cost === null
          ? "Tidak tersedia"
          : `${formatNumber(metrics.annualized_cost, 0)} ${units.currency}`,
    },
    {
      label: "NPV umur proyek",
      value:
        metrics.npv === null
          ? "Tidak tersedia"
          : `${formatNumber(metrics.npv, 0)} ${units.currency}`,
    },
  ];

  return (
    <SectionCard
      icon={IconListCheck}
      title="Validasi hasil"
      description="Pemeriksaan terhadap solusi skenario ini."
    >
      <p
        className={cn(
          "rounded-md px-3 py-2 text-small",
          allPassed ? "bg-subtle text-success" : "bg-subtle text-warning",
        )}
      >
        {allPassed
          ? "Semua pemeriksaan lolos."
          : "Ada pemeriksaan yang gagal atau belum dilakukan. Jangan sebut hasil ini optimal sebelum diaudit."}
      </p>

      <ul className="flex flex-col">
        {CHECKS.map(({ key, label }) => (
          <li
            key={key}
            className="flex items-center justify-between gap-3 border-line border-b py-2"
          >
            <span className="flex items-center gap-2 text-small">
              <CheckIcon passed={validation[key]} />
              {label}
            </span>
            <span className="text-fg-secondary text-small">
              {checkLabel(validation[key])}
            </span>
          </li>
        ))}
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 border-line border-b py-2 last:border-b-0"
          >
            <span className="text-fg-secondary text-small">{row.label}</span>
            <span className="text-right text-num-sm">{row.value}</span>
          </li>
        ))}
      </ul>

      {validation.solver_message && (
        <p className="font-mono text-code text-fg-tertiary">
          {validation.solver_message}
        </p>
      )}

      {validation.warnings.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-body-strong text-warning">
            {formatNumber(validation.warnings.length)} catatan model
          </summary>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            {validation.warnings.map((warning) => (
              <li key={warning} className="text-fg-secondary text-small">
                {warning}
              </li>
            ))}
          </ul>
        </details>
      )}
    </SectionCard>
  );
};

export default ValidasiSection;
