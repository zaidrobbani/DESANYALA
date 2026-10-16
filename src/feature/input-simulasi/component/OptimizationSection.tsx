import { IconShieldCheck, IconTarget } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ScenarioKey } from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import SubPanel from "@/shared/component/SubPanel";
import {
  OBJECTIVE_OPTIONS,
  RELIABILITY_FIELDS,
  SCENARIO_OPTIONS,
  SHORTAGE_POLICY_OPTIONS,
  SIMULATION_STEPS,
} from "../data";
import FormNote from "./FormNote";
import FormNumberField, { type SectionFieldProps } from "./FormNumberField";
import FormSelectField from "./FormSelectField";

const STEP = SIMULATION_STEPS[6];

type OptimizationSectionProps = SectionFieldProps & {
  shortagePolicy: "forbid" | "bounded";
  selectedScenarios: readonly ScenarioKey[];
  batteryEnabled: boolean;
  onScenarioToggle: (id: ScenarioKey, checked: boolean) => void;
};

const OptimizationSection = ({
  control,
  shortagePolicy,
  selectedScenarios,
  batteryEnabled,
  onScenarioToggle,
  ...fieldProps
}: OptimizationSectionProps) => {
  const scenarioError = fieldProps.errors.optimization?.scenarios?.message;

  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SubPanel icon={IconShieldCheck} title="Keandalan pasokan">
          <FormNumberField
            name="reliability.target_supply_fraction"
            meta={RELIABILITY_FIELDS.target_supply_fraction}
            {...fieldProps}
          />
          <FormSelectField
            control={control}
            name="reliability.shortage_policy"
            id="shortagePolicy"
            label="Kebijakan kekurangan listrik"
            options={SHORTAGE_POLICY_OPTIONS}
            className="flex-none"
          />
          {shortagePolicy === "bounded" && (
            <FormNumberField
              name="reliability.max_unmet_energy_fraction"
              meta={RELIABILITY_FIELDS.max_unmet_energy_fraction}
              {...fieldProps}
            />
          )}
          <FormNumberField
            name="reliability.reserve_margin_fraction"
            meta={RELIABILITY_FIELDS.reserve_margin_fraction}
            {...fieldProps}
          />
        </SubPanel>

        <SubPanel icon={IconTarget} title="Tujuan & skenario">
          <FormSelectField
            control={control}
            name="optimization.objective"
            id="objective"
            label="Tujuan utama optimasi"
            options={OBJECTIVE_OPTIONS}
            className="flex-none"
          />
          <p className="text-fg-tertiary text-small">
            Tujuan selain biaya perlu fungsi objektif yang sesuai di backend.
          </p>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-fg-primary text-label">
              Skenario yang dibandingkan
            </legend>
            {SCENARIO_OPTIONS.map((option) => {
              const checked = selectedScenarios.includes(option.id);
              return (
                <label
                  key={option.id}
                  htmlFor={option.htmlId}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-md bg-surface px-3 py-2.5 transition-colors",
                    checked
                      ? "border-[1.5px] border-brand"
                      : "border border-line hover:border-line-strong",
                  )}
                >
                  <Checkbox
                    id={option.htmlId}
                    checked={checked}
                    onCheckedChange={(value) =>
                      onScenarioToggle(option.id, value === true)
                    }
                    className="mt-0.5 size-[18px] rounded-sm border-line-strong"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-body-strong">
                      {option.label}
                      {option.id === "pv_diesel_battery" && !batteryEnabled
                        ? " (tanpa baterai)"
                        : ""}
                    </span>
                    <span className="text-fg-tertiary text-small">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
            {scenarioError && (
              <p className="text-danger text-small">{scenarioError}</p>
            )}
          </fieldset>
        </SubPanel>
      </div>

      <FormNote>
        Target dan batas di card ini harus diterjemahkan backend menjadi kendala
        matematis; angka di UI tidak dengan sendirinya menjamin model telah
        menegakkannya.
      </FormNote>
    </SectionCard>
  );
};

export default OptimizationSection;
