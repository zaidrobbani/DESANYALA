import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { FieldArrayWithId } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SimulationFormValues } from "@/schemas/simulation/simulation.schema";
import NumberField from "@/shared/component/NumberField";
import SectionCard from "@/shared/component/SectionCard";
import TextField from "@/shared/component/TextField";
import { formatNumber } from "@/shared/util/number";
import { LOAD_CATEGORY_OPTIONS, SIMULATION_STEPS } from "../data";
import FormNote from "./FormNote";
import type { SectionFieldProps } from "./FormNumberField";
import FormSelectField from "./FormSelectField";

const STEP = SIMULATION_STEPS[1];

interface StatProps {
  id: string;
  label: string;
  value: string;
  unit: string;
  className?: string;
}

const Stat = ({ id, label, value, unit, className }: StatProps) => (
  <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}>
    <dt className="text-fg-secondary text-small">{label}</dt>
    <dd id={id} className="flex items-baseline gap-1.5">
      <span className="text-kpi">{value}</span>
      <span className="text-fg-tertiary text-small">{unit}</span>
    </dd>
  </div>
);

type DemandSectionProps = Pick<
  SectionFieldProps,
  "control" | "register" | "errors"
> & {
  fields: FieldArrayWithId<SimulationFormValues, "demand.loads">[];
  summary: {
    dailyEnergyKwh: number;
    annualEnergyKwh: number;
    connectedPowerKw: number;
  };
  onAdd: () => void;
  onRemove: (index: number) => void;
};

const DemandSection = ({
  control,
  register,
  errors,
  fields,
  summary,
  onAdd,
  onRemove,
}: DemandSectionProps) => {
  const loadErrors = errors.demand?.loads;
  const listError = loadErrors?.root?.message ?? loadErrors?.message;

  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
      action={
        <Button
          id="addEquipmentBtn"
          type="button"
          variant="outline"
          onClick={onAdd}
          className="h-9 gap-2 rounded-md border-line-strong bg-surface px-3 text-body-strong text-fg-primary"
        >
          <IconPlus aria-hidden className="size-4" stroke={1.75} />
          Tambah beban
        </Button>
      }
    >
      <ol id="equipmentList" className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const rowErrors = loadErrors?.[index];
          const prefix = `load-${index}`;
          return (
            <li
              key={field.id}
              data-load-row
              className="flex flex-col gap-3 rounded-lg bg-subtle p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-body-strong">Peralatan {index + 1}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  aria-label={`Hapus peralatan ${index + 1}`}
                  className="h-7 gap-1.5 px-2 text-danger text-small hover:text-danger"
                >
                  <IconTrash aria-hidden className="size-4" stroke={1.75} />
                  Hapus
                </Button>
              </div>
              <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.4fr_1fr_1fr_1.1fr]">
                <FormSelectField
                  control={control}
                  name={`demand.loads.${index}.category`}
                  id={`${prefix}-category`}
                  label="Kategori"
                  options={LOAD_CATEGORY_OPTIONS}
                />
                <TextField
                  id={`${prefix}-device`}
                  data-key="device"
                  label="Nama peralatan"
                  placeholder="Mis. kulkas"
                  error={rowErrors?.device?.message}
                  {...register(`demand.loads.${index}.device`)}
                />
                <NumberField
                  id={`${prefix}-quantity`}
                  data-key="quantity"
                  label="Jumlah"
                  unit="unit"
                  inputMode="numeric"
                  error={rowErrors?.quantity?.message}
                  {...register(`demand.loads.${index}.quantity`)}
                />
                <NumberField
                  id={`${prefix}-power`}
                  data-key="power_w"
                  label="Daya/unit"
                  unit="W"
                  placeholder="Watt"
                  error={rowErrors?.power_w?.message}
                  {...register(`demand.loads.${index}.power_w`)}
                />
                <NumberField
                  id={`${prefix}-hours`}
                  data-key="hours_per_day"
                  label="Pemakaian"
                  unit="jam/hari"
                  error={rowErrors?.hours_per_day?.message}
                  {...register(`demand.loads.${index}.hours_per_day`)}
                />
              </div>
            </li>
          );
        })}
      </ol>
      {listError && <p className="text-danger text-small">{listError}</p>}

      <dl className="grid grid-cols-1 gap-4 sm:flex sm:gap-0">
        <Stat
          id="dailyEnergy"
          label="Estimasi energi harian"
          value={formatNumber(summary.dailyEnergyKwh, 2, 2)}
          unit="kWh/hari"
          className="sm:pr-5"
        />
        <Stat
          id="annualEnergy"
          label="Estimasi energi tahunan"
          value={formatNumber(summary.annualEnergyKwh, 0)}
          unit="kWh/tahun"
          className="sm:border-line sm:border-l sm:px-5"
        />
        <Stat
          id="connectedPower"
          label="Total daya terpasang"
          value={formatNumber(summary.connectedPowerKw, 2, 2)}
          unit="kW"
          className="sm:border-line sm:border-l sm:px-5"
        />
      </dl>

      <FormNote>
        Ini perkiraan awal, bukan profil beban per jam. Backend masih perlu
        membentuk jadwal penggunaan dan faktor keserentakan agar model tidak
        mengasumsikan semua peralatan menyala bersamaan.
      </FormNote>
    </SectionCard>
  );
};

export default DemandSection;
