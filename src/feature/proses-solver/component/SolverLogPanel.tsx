import { IconTerminal2 } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { SolverLogLine } from "@/repository/simulation/dto";
import { LOG_LEVEL_CLASS } from "../data";

interface SolverLogPanelProps {
  logs: SolverLogLine[];
}

const SolverLogPanel = ({ logs }: SolverLogPanelProps) => {
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
      aria-labelledby="log-solver-title"
      className="flex w-full flex-col gap-2.5 rounded-lg bg-surface px-4 py-5 sm:px-6"
    >
      <div className="flex items-center gap-2">
        <IconTerminal2
          aria-hidden
          className="size-5 shrink-0 text-fg-secondary"
          stroke={1.75}
        />
        <h2 id="log-solver-title" className="text-h3">
          Log solver
        </h2>
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
