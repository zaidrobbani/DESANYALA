import type React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TextFieldProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
}

/** Field teks satu baris dengan label (Figma: Text Field v2). */
const TextField = ({
  id,
  label,
  error,
  className,
  ...props
}: TextFieldProps) => {
  const inputId = id ?? props.name;
  const messageId = inputId ? `${inputId}-message` : undefined;

  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-fg-primary text-label">
        {label}
      </label>
      <Input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? messageId : undefined}
        className="h-[42px] rounded-md border-line-strong bg-surface px-3 text-body text-fg-primary placeholder:text-fg-tertiary md:text-body"
        {...props}
      />
      {error && (
        <p id={messageId} className="text-danger text-small">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextField;
