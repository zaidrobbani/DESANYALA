import { IconChevronDown } from "@tabler/icons-react";
import { Select as SelectPrimitive } from "radix-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

/**
 * Dropdown dengan label (Figma: Text Field v2 · Select).
 * Trigger dirakit dari primitive Radix agar ikon chevron memakai Tabler
 * dan ukurannya sama dengan TextField.
 */
const SelectField = ({
  id,
  label,
  value,
  options,
  onValueChange,
  placeholder = "Pilih",
  error,
  className,
}: SelectFieldProps) => {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-fg-primary text-label">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          id={id}
          aria-invalid={Boolean(error)}
          className="flex h-[42px] w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-surface px-3 text-body text-fg-primary outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive data-placeholder:text-fg-tertiary [&>span]:truncate"
        >
          <SelectValue placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <IconChevronDown
              aria-hidden
              className="size-4 shrink-0 text-fg-secondary"
              stroke={1.75}
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectContent position="popper" className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-danger text-small">{error}</p>}
    </div>
  );
};

export default SelectField;
