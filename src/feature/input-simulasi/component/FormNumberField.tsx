import {
  type Control,
  type FieldErrors,
  get,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import type {
  SimulationFormSection,
  SimulationFormValues,
} from "@/schemas/simulation/simulation.schema";
import NumberField, { type FieldSource } from "@/shared/component/NumberField";
import type { NumberFieldMeta } from "../data";

export type FormFieldPath = Path<SimulationFormValues> &
  `${SimulationFormSection}.${string}`;

export interface FormNumberFieldProps {
  name: FormFieldPath;
  meta: NumberFieldMeta;
  register: UseFormRegister<SimulationFormValues>;
  errors: FieldErrors<SimulationFormValues>;
  sourceFor: (path: FormFieldPath, meta: NumberFieldMeta) => FieldSource;
  /** Mata uang proyek, pengganti `{cur}` di satuan. */
  currency: string;
  /** Field lain yang ikut divalidasi ulang saat field ini berubah. */
  deps?: FormFieldPath[];
  helper?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

/** Props bersama yang diteruskan container ke setiap section. */
export type SectionFieldProps = Pick<
  FormNumberFieldProps,
  "register" | "errors" | "sourceFor" | "currency"
> & {
  control: Control<SimulationFormValues>;
};

/** NumberField yang terhubung ke react-hook-form berdasarkan meta di data.ts. */
const FormNumberField = ({
  name,
  meta,
  register,
  errors,
  sourceFor,
  currency,
  deps,
  helper,
  inputMode,
}: FormNumberFieldProps) => {
  return (
    <NumberField
      id={meta.id}
      label={meta.label}
      unit={meta.unit.replace("{cur}", currency)}
      helper={helper ?? meta.helper}
      source={sourceFor(name, meta)}
      error={get(errors, name)?.message}
      inputMode={inputMode}
      {...register(name, { deps })}
    />
  );
};

export default FormNumberField;
