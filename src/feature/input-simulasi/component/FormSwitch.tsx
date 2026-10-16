import { type Control, Controller } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import type { SimulationFormValues } from "@/schemas/simulation/simulation.schema";

interface FormSwitchProps {
  control: Control<SimulationFormValues>;
  name: "pv.enabled" | "battery.enabled";
  /** HTML ID di desanyala_input_cards.html. */
  id: string;
  label: string;
  onChange?: (checked: boolean) => void;
}

/** Toggle aktif/nonaktif komponen, dipasang di slot `action` SectionCard. */
const FormSwitch = ({
  control,
  name,
  id,
  label,
  onChange,
}: FormSwitchProps) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-2.5 text-body-strong text-fg-primary"
        >
          <Switch
            id={id}
            ref={field.ref}
            checked={field.value}
            onCheckedChange={(checked) => {
              field.onChange(checked);
              onChange?.(checked);
            }}
            onBlur={field.onBlur}
          />
          {label}
        </label>
      )}
    />
  );
};

export default FormSwitch;
