import { IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { SimulationSectionKey } from "@/schemas/simulation/simulation.schema";
import type { SimulationStep } from "../data";
import type { StepState } from "../hooks/useInputSimulasiContainer";

interface StepperNavProps {
  steps: (SimulationStep & { state: StepState; hasError: boolean })[];
  onStepClick: (key: SimulationSectionKey) => void;
}

const StepperNav = ({ steps, onStepClick }: StepperNavProps) => {
  return (
    <nav
      aria-label="Langkah input simulasi"
      className="rounded-lg bg-surface px-3 pt-5 pb-2"
    >
      <ol>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.key}>
              <button
                type="button"
                onClick={() => onStepClick(step.key)}
                aria-current={step.state === "active" ? "step" : undefined}
                className="group flex h-16 w-full gap-3 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex h-full flex-col items-center gap-1">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-body-strong",
                      step.state === "default"
                        ? "border border-line-strong bg-surface text-fg-tertiary"
                        : "bg-brand text-fg-inverse",
                      step.hasError &&
                        step.state === "default" &&
                        "border-danger text-danger",
                    )}
                  >
                    {step.state === "done" ? (
                      <IconCheck
                        aria-hidden
                        className="size-3.5"
                        stroke={2.5}
                      />
                    ) : (
                      step.number
                    )}
                  </span>
                  {!isLast && (
                    <span
                      aria-hidden
                      className={cn(
                        "w-0.5 flex-1",
                        step.state === "done" ? "bg-brand" : "bg-line",
                      )}
                    />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1 pb-3">
                  <span
                    className={cn(
                      "text-body-strong group-hover:text-brand",
                      step.state === "default"
                        ? "text-fg-secondary"
                        : "text-fg-primary",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="text-fg-tertiary text-small">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepperNav;
