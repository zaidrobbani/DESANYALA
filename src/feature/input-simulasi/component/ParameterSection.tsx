import {
  IconBatteryCharging2,
  IconEngine,
  IconSolarPanel,
} from "@tabler/icons-react";
import SectionCard from "@/shared/component/SectionCard";
import SubPanel from "@/shared/component/SubPanel";
import { PARAMETER_FIELDS, SIMULATION_STEPS } from "../data";
import FormNumberField, { type FormNumberFieldProps } from "./FormNumberField";

const STEP = SIMULATION_STEPS[2];

type ParameterSectionProps = Pick<
  FormNumberFieldProps,
  "register" | "errors" | "sourceFor"
> & {
  dieselHelper: string;
};

const ParameterSection = ({
  dieselHelper,
  ...fieldProps
}: ParameterSectionProps) => {
  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SubPanel
          icon={IconEngine}
          iconClassName="text-energy-diesel"
          title="Generator diesel"
          description="Eksisting, sama di kedua skenario"
        >
          <FormNumberField
            name="parameter.diesel_kapasitas"
            meta={PARAMETER_FIELDS.diesel_kapasitas}
            helper={dieselHelper}
            inputMode="text"
            {...fieldProps}
          />
          <FormNumberField
            name="parameter.diesel_min_load"
            meta={PARAMETER_FIELDS.diesel_min_load}
            {...fieldProps}
          />
          <FormNumberField
            name="parameter.diesel_konsumsi"
            meta={PARAMETER_FIELDS.diesel_konsumsi}
            {...fieldProps}
          />
        </SubPanel>

        <SubPanel
          icon={IconSolarPanel}
          iconClassName="text-energy-pv-ink"
          title="Panel surya (PV)"
          description="Kapasitas dicari optimizer"
        >
          <FormNumberField
            name="parameter.pv_maks"
            meta={PARAMETER_FIELDS.pv_maks}
            {...fieldProps}
          />
          <FormNumberField
            name="parameter.pv_radiasi"
            meta={PARAMETER_FIELDS.pv_radiasi}
            {...fieldProps}
          />
          <FormNumberField
            name="parameter.pv_umur"
            meta={PARAMETER_FIELDS.pv_umur}
            inputMode="numeric"
            {...fieldProps}
          />
        </SubPanel>

        <SubPanel
          icon={IconBatteryCharging2}
          iconClassName="text-energy-battery"
          title="Baterai"
          description="Kapasitas dicari optimizer"
        >
          <FormNumberField
            name="parameter.baterai_maks"
            meta={PARAMETER_FIELDS.baterai_maks}
            {...fieldProps}
          />
          <FormNumberField
            name="parameter.baterai_soc_min"
            meta={PARAMETER_FIELDS.baterai_soc_min}
            {...fieldProps}
          />
          <FormNumberField
            name="parameter.baterai_efisiensi"
            meta={PARAMETER_FIELDS.baterai_efisiensi}
            {...fieldProps}
          />
        </SubPanel>
      </div>
    </SectionCard>
  );
};

export default ParameterSection;
