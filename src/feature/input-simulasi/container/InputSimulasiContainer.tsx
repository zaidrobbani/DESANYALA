"use client";

import PageHero from "@/shared/component/PageHero";
import BiayaSection from "../component/BiayaSection";
import FormFooter from "../component/FormFooter";
import KebutuhanSection from "../component/KebutuhanSection";
import LokasiSection from "../component/LokasiSection";
import ParameterSection from "../component/ParameterSection";
import StepperNav from "../component/StepperNav";
import ValidationPanel from "../component/ValidationPanel";
import { useInputSimulasiContainer } from "../hooks/useInputSimulasiContainer";

const InputSimulasiContainer = () => {
  const {
    control,
    register,
    errors,
    sourceFor,
    coordinates,
    handleProvinceChange,
    kebutuhan,
    presets,
    selectedPreset,
    isPresetsLoading,
    presetsError,
    refetchPresets,
    chartProfile,
    handlePresetChange,
    handleModeChange,
    handleFileChange,
    validationState,
    dieselHelper,
    usdHelpers,
    steps,
    scrollToSection,
    onSubmit,
    handleReset,
    isSubmitting,
  } = useInputSimulasiContainer();

  return (
    <>
      <PageHero
        eyebrow="Simulasi · langkah 1 dari 2"
        title="Atur skenario energi desa"
        description="Masukkan kondisi desa, kebutuhan listrik, dan asumsi biaya. Optimizer membandingkan diesel saja dengan diesel + panel surya + baterai pada beban yang sama."
        meta="Studi kasus demo: Kampung Yensawai, Raja Ampat · 2 × 80 kW diesel · 728,83 kWh/hari (Subekti dkk. 2024)"
        className="mb-1"
      />

      <div className="flex items-start gap-6">
        <aside className="sticky top-22 hidden w-65 shrink-0 flex-col gap-4 lg:flex">
          <StepperNav steps={steps} onStepClick={scrollToSection} />
          <ValidationPanel state={validationState} />
        </aside>

        <form
          noValidate
          onSubmit={onSubmit}
          aria-label="Input skenario simulasi"
          className="flex min-w-0 flex-1 flex-col gap-5"
        >
          <LokasiSection
            control={control}
            register={register}
            errors={errors.lokasi}
            coordinates={coordinates}
            onProvinceChange={handleProvinceChange}
          />
          <KebutuhanSection
            register={register}
            errors={errors.kebutuhan}
            kebutuhan={kebutuhan}
            presets={presets}
            selectedPreset={selectedPreset}
            isPresetsLoading={isPresetsLoading}
            presetsError={presetsError}
            onRetryPresets={() => refetchPresets()}
            chartProfile={chartProfile}
            sourceFor={sourceFor}
            onModeChange={handleModeChange}
            onPresetChange={handlePresetChange}
            onFileChange={handleFileChange}
          />
          <ValidationPanel state={validationState} className="lg:hidden" />
          <ParameterSection
            register={register}
            errors={errors}
            sourceFor={sourceFor}
            dieselHelper={dieselHelper}
          />
          <BiayaSection
            control={control}
            register={register}
            errors={errors}
            sourceFor={sourceFor}
            usdHelpers={usdHelpers}
          />
          <FormFooter isSubmitting={isSubmitting} onReset={handleReset} />
        </form>
      </div>
    </>
  );
};

export default InputSimulasiContainer;
