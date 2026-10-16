import { IconAlertTriangle, IconPencil } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SourceBadge from "@/shared/component/SourceBadge";
import { type ConflictIssue, type InputField, LIKELIHOOD_META } from "../data";

interface ConflictIssuesPanelProps {
  issues: ConflictIssue[];
  onEditField: (field: InputField) => void;
}

/** Daftar parameter yang diduga membuat model infeasible, urut peringkat. */
const ConflictIssuesPanel = ({
  issues,
  onEditField,
}: ConflictIssuesPanelProps) => {
  return (
    <section
      aria-labelledby="conflict-issues-title"
      className="flex w-full flex-col gap-1 rounded-lg bg-surface px-4 py-5 sm:px-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-2">
        <div className="flex items-center gap-2">
          <IconAlertTriangle
            aria-hidden
            className="size-5 shrink-0 text-danger"
            stroke={1.75}
          />
          <h2 id="conflict-issues-title" className="text-h3">
            Parameter yang berpotensi bentrok
          </h2>
        </div>
        <p className="text-fg-tertiary text-small">
          Dugaan dari input, bukan dari solver
        </p>
      </header>

      {issues.length === 0 ? (
        <p className="py-4 text-fg-secondary text-small">
          Tidak ada parameter yang mencurigakan menurut aturan sederhana FE.
          Baca pesan backend di samping, lalu periksa batas kapasitas dan
          kebijakan kekurangan energi di input.
        </p>
      ) : (
        <ol>
          {issues.map((issue, index) => {
            const likelihood = LIKELIHOOD_META[issue.likelihood];
            return (
              <li
                key={issue.field}
                className="flex gap-3.5 border-line border-b py-4 last:border-b-0"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-num-sm",
                    likelihood.rankClass,
                  )}
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                    <h3 className="text-body-strong">{issue.label}</h3>
                    <SourceBadge tone={likelihood.tone}>
                      {likelihood.label}
                    </SourceBadge>
                  </div>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-fg-secondary text-small">
                      Nilai saat ini:
                    </span>
                    <span className="text-value">{issue.current_value}</span>
                    <span className="text-fg-tertiary text-small">
                      di {issue.section}
                    </span>
                  </p>
                  <p className="text-fg-secondary text-small">
                    {issue.explanation}
                  </p>
                  <p className="text-fg-primary text-small">
                    Saran: {issue.suggestion}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onEditField(issue.field)}
                    className="h-10 gap-2 rounded-md border-line-strong bg-surface px-4 text-body-strong text-fg-primary"
                  >
                    <IconPencil aria-hidden className="size-4" stroke={1.75} />
                    Ubah di input
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default ConflictIssuesPanel;
