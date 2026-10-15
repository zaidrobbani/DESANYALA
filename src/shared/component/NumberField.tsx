import type React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import SourceBadge, { type SourceTone } from "@/shared/component/SourceBadge";

export interface FieldSource {
  tone: SourceTone;
  label: string;
}

interface NumberFieldProps
  extends Omit<React.ComponentProps<"input">, "size" | "children"> {
  label: string;
  unit?: string;
  helper?: React.ReactNode;
  error?: string;
  source?: FieldSource;
  className?: string;
}

/**
 * Input angka dengan satuan dan badge sumber data.
 * Satuan wajib ditulis (aturan desain MVP no. 6).
 */
const NumberField = ({
  id,
  label,
  unit,
  helper,
  error,
  source,
  className,
  ...inputProps
}: NumberFieldProps) => {
  const inputId = id ?? inputProps.name;
  const messageId = inputId ? `${inputId}-message` : undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="truncate text-fg-primary text-label"
        >
          {label}
        </label>
        {source && <SourceBadge tone={source.tone}>{source.label}</SourceBadge>}
      </div>

      <InputGroup className="h-auto rounded-md border-line-strong bg-surface">
        <InputGroupInput
          id={inputId}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={messageId}
          className="h-[38px] px-3 py-2 text-fg-primary text-value md:text-value"
          {...inputProps}
        />
        {unit && (
          <InputGroupAddon align="inline-end" className="pr-3">
            <InputGroupText className="text-fg-tertiary text-small">
              {unit}
            </InputGroupText>
          </InputGroupAddon>
        )}
      </InputGroup>

      {(error || helper) && (
        <p
          id={messageId}
          className={cn(
            "text-small",
            error ? "text-danger" : "text-fg-tertiary",
          )}
        >
          {error ?? helper}
        </p>
      )}
    </div>
  );
};

export default NumberField;
