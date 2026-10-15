import {
  IconAlertTriangle,
  IconCheck,
  IconChecklist,
  IconX,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/shared/util/number";
import type { ValidationState } from "../hooks/useInputSimulasiContainer";
import { isValidRowCount } from "../util/parse-load-profile-csv";

type CheckStatus = "pass" | "warning" | "fail";

const STATUS_STYLE: Record<
  CheckStatus,
  { icon: typeof IconCheck; className: string }
> = {
  pass: { icon: IconCheck, className: "text-success" },
  warning: { icon: IconAlertTriangle, className: "text-warning" },
  fail: { icon: IconX, className: "text-danger" },
};

interface CheckItemProps {
  label: string;
  value: string;
  status: CheckStatus;
}

const CheckItem = ({ label, value, status }: CheckItemProps) => {
  const { icon: StatusIcon, className } = STATUS_STYLE[status];
  return (
    <li className="flex items-center gap-2.5 py-2">
      <StatusIcon
        aria-hidden
        className={cn("size-4 shrink-0", className)}
        stroke={1.75}
      />
      <span className="min-w-0 flex-1 text-body text-fg-primary">{label}</span>
      <span className={cn("text-label", className)}>{value}</span>
    </li>
  );
};

interface ValidationPanelProps {
  state: ValidationState;
  className?: string;
}

const ValidationPanel = ({ state, className }: ValidationPanelProps) => {
  return (
    <section
      aria-labelledby="validasi-data-title"
      className={cn("flex flex-col gap-1 rounded-lg bg-surface p-4", className)}
    >
      <div className="flex items-center gap-2">
        <IconChecklist
          aria-hidden
          className="size-5 shrink-0 text-brand"
          stroke={1.75}
        />
        <h2 id="validasi-data-title" className="text-body-strong">
          Validasi data
        </h2>
      </div>
      <p className="text-fg-tertiary text-small">
        Dicek otomatis sebelum solver dipanggil.
      </p>

      {state.kind === "loading" && (
        <div className="flex flex-col gap-3 py-2">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-5 w-full bg-track" />
          ))}
        </div>
      )}

      {state.kind === "server" && (
        <p className="py-2 text-fg-secondary text-small">
          File .xlsx divalidasi server saat optimasi dijalankan.
        </p>
      )}

      {state.kind === "ready" && (
        <ul aria-live="polite">
          <CheckItem
            label={`${formatNumber(state.validation.rows)} baris, interval 1 jam`}
            value={isValidRowCount(state.validation.rows) ? "OK" : "Cek"}
            status={isValidRowCount(state.validation.rows) ? "pass" : "fail"}
          />
          <CheckItem
            label={`Satuan konsisten (${state.validation.unit})`}
            value={state.validation.unit_consistent ? "OK" : "Cek"}
            status={state.validation.unit_consistent ? "pass" : "warning"}
          />
          <CheckItem
            label="Tanpa nilai negatif"
            value={formatNumber(state.validation.negative_count)}
            status={state.validation.negative_count === 0 ? "pass" : "fail"}
          />
          <CheckItem
            label="Nilai kosong diinterpolasi"
            value={formatNumber(state.validation.interpolated_count)}
            status={
              state.validation.interpolated_count === 0 ? "pass" : "warning"
            }
          />
        </ul>
      )}
    </section>
  );
};

export default ValidationPanel;
