import { IconTerminal2 } from "@tabler/icons-react";
import type React from "react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import type { SolverLogLine } from "@/repository/simulation/dto";

const LOG_LEVEL_CLASS: Record<SolverLogLine["level"], string> = {
  command: "text-fg-tertiary",
  info: "text-fg-primary",
  success: "text-success",
  error: "text-danger",
};

interface SolverLogPanelProps {
  logs: SolverLogLine[];
  title?: string;
  /** Label di kanan judul, mis. <SourceBadge>. */
  badge?: React.ReactNode;
  className?: string;
}

/** Log solver apa adanya (Code/Small) di kotak bg-subtle. */
const SolverLogPanel = ({
  logs,
  title = "Log solver",
  badge,
  className,
}: SolverLogPanelProps) => {
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const lineCount = logs.length;

  // Ikuti baris terakhir saat log bertambah.
  useEffect(() => {
    if (lineCount === 0) return;
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [lineCount]);

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-lg bg-surface px-4 py-5 sm:px-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconTerminal2
            aria-hidden
            className="size-5 shrink-0 text-fg-secondary"
            stroke={1.75}
          />
          <h2 id={titleId} className="text-h3">
            {title}
          </h2>
        </div>
        {badge}
      </div>
      <div
        ref={boxRef}
        role="log"
        aria-live="polite"
        // Area scroll harus bisa difokus keyboard (WCAG scrollable-region-focusable).
        // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable log region
        tabIndex={0}
        className="flex max-h-[260px] min-h-[120px] flex-col gap-0.5 overflow-y-auto rounded-md bg-subtle p-3 font-mono text-code outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {logs.length === 0 ? (
          <p className="text-fg-tertiary">Menunggu solver…</p>
        ) : (
          logs.map((line, index) => (
            <p
              // Log hanya bertambah di akhir, jadi index stabil.
              // biome-ignore lint/suspicious/noArrayIndexKey: append-only log
              key={index}
              className={cn("whitespace-pre-wrap", LOG_LEVEL_CLASS[line.level])}
            >
              {line.text}
            </p>
          ))
        )}
      </div>
    </section>
  );
};

export default SolverLogPanel;
