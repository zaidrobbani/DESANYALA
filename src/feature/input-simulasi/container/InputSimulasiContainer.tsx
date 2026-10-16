"use client";

import { Skeleton } from "@/components/ui/skeleton";
import PageHero from "@/shared/component/PageHero";
import BatterySection from "../component/BatterySection";
import ConfigSummaryPanel from "../component/ConfigSummaryPanel";
import DemandSection from "../component/DemandSection";
import EconomicsSection from "../component/EconomicsSection";
import FormFooter from "../component/FormFooter";
import GeneratorSection from "../component/GeneratorSection";
import OptimizationSection from "../component/OptimizationSection";
import ProjectSection from "../component/ProjectSection";
import PvSection from "../component/PvSection";
import StepperNav from "../component/StepperNav";
import { SIMULATION_FORM_DEFAULTS } from "../data";
import { useInputSimulasiContainer } from "../hooks/useInputSimulasiContainer";

export const InputSimulasiHero = () => (
  <PageHero
    eyebrow="Simulasi · langkah 1 dari 2"
    title="Konfigurasi sistem energi desa"
    description="Masukkan kebutuhan listrik, sumber energi, spesifikasi genset, dan batas teknis sistem. DesaNyala menerjemahkan konfigurasi ini menjadi parameter model optimasi."
    meta="Angka awal adalah contoh dan perlu divalidasi terhadap data lokasi nyata · kontrak input desanyala.input.v1"
    className="mb-1"
  />
);

export const InputSimulasiSkeleton = () => (
  <div className="flex items-start gap-6">
    <Skeleton className="hidden h-130 w-65 shrink-0 rounded-lg bg-surface lg:block" />
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <Skeleton className="h-60 w-full rounded-lg bg-surface" />
      <Skeleton className="h-105 w-full rounded-lg bg-surface" />
    </div>
  </div>
);

const InputSimulasiContainer = () => {
  const {
    control,
    register,
    errors,
    sourceFor,
    currency,
    watchedValues,
    loadFields,
    demandSummary,
    handleAddLoad,
    handleRemoveLoad,
    handlePvToggle,
    handleBatteryToggle,
    handleScenarioToggle,
    summary,
    steps,
    scrollToStep,
    onSubmit,
    handleReset,
    isSubmitting,
  } = useInputSimulasiContainer();

  const sectionProps = { control, register, errors, sourceFor, currency };
  const { pv, generators, reliability, optimization } =
    SIMULATION_FORM_DEFAULTS;

  return (
    <div className="flex items-start gap-6">
      <aside className="sticky top-22 hidden max-h-[calc(100vh-6.5rem)] w-65 shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
        <StepperNav steps={steps} onStepClick={scrollToStep} />
        <ConfigSummaryPanel summary={summary} />
      </aside>

      <form
        id="configForm"
        noValidate
        onSubmit={onSubmit}
        aria-label="Konfigurasi sistem energi desa"
        className="flex min-w-0 flex-1 flex-col gap-5"
      >
        <ProjectSection {...sectionProps} />
        <DemandSection
          control={control}
          register={register}
          errors={errors}
          fields={loadFields}
          summary={demandSummary}
          onAdd={handleAddLoad}
          onRemove={handleRemoveLoad}
        />
        <PvSection
          {...sectionProps}
          enabled={watchedValues.pv?.enabled ?? pv.enabled}
          capacityMode={watchedValues.pv?.capacity_mode ?? pv.capacity_mode}
          onEnabledChange={handlePvToggle}
        />
        <GeneratorSection
          {...sectionProps}
          fuelModel={
            watchedValues.generators?.fuel_model ?? generators.fuel_model
          }
        />
        <BatterySection
          {...sectionProps}
          enabled={summary.batteryEnabled}
          onEnabledChange={handleBatteryToggle}
        />
        <EconomicsSection {...sectionProps} />
        <OptimizationSection
          {...sectionProps}
          shortagePolicy={
            watchedValues.reliability?.shortage_policy ??
            reliability.shortage_policy
          }
          selectedScenarios={
            watchedValues.optimization?.scenarios ?? optimization.scenarios
          }
          batteryEnabled={summary.batteryEnabled}
          onScenarioToggle={handleScenarioToggle}
        />
        <ConfigSummaryPanel
          summary={summary}
          idPrefix="mobile-"
          className="lg:hidden"
        />
        <FormFooter isSubmitting={isSubmitting} onReset={handleReset} />
      </form>
    </div>
  );
};

export default InputSimulasiContainer;
