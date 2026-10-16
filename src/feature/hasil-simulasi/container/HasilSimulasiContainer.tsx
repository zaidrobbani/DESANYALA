"use client";

import type React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import LoadErrorPanel from "@/shared/component/LoadErrorPanel";
import PageHero from "@/shared/component/PageHero";
import { formatNumber } from "@/shared/util/number";
import EksporSection from "../component/EksporSection";
import HasilFooter from "../component/HasilFooter";
import HeroResultPanel from "../component/HeroResultPanel";
import InfeasibleView from "../component/InfeasibleView";
import KapasitasSection from "../component/KapasitasSection";
import KecukupanSection from "../component/KecukupanSection";
import KpiGrid from "../component/KpiGrid";
import OperasiEnergiSection from "../component/OperasiEnergiSection";
import PerbandinganSection from "../component/PerbandinganSection";
import ResultStatusBanner from "../component/ResultStatusBanner";
import RingkasanEnergiSection from "../component/RingkasanEnergiSection";
import ScenarioTabs from "../component/ScenarioTabs";
import ValidasiSection from "../component/ValidasiSection";
import { SCENARIO_META } from "../data";
import { useHasilSimulasiContainer } from "../hooks/useHasilSimulasiContainer";

const LAYOUT = "grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]";

const DEFAULT_DESCRIPTION =
  "Bandingkan kapasitas pembangkit, biaya energi, konsumsi diesel, dan operasi baterai.";

interface HasilSimulasiHeroProps {
  title?: string;
  description?: string;
  size?: "lg" | "md";
  aside?: React.ReactNode;
}

export const HasilSimulasiHero = ({
  title = "Hasil optimasi sistem energi",
  description = DEFAULT_DESCRIPTION,
  size = "lg",
  aside,
}: HasilSimulasiHeroProps) => (
  <PageHero
    size={size}
    eyebrow="Hasil simulasi · langkah 2 dari 2"
    title={title}
    description={description}
    aside={aside}
  />
);

export const HasilSimulasiSkeleton = () => (
  <>
    <Skeleton className="h-[84px] w-full rounded-md bg-surface" />
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {["lcoe", "fuel", "renewable", "unmet"].map((key) => (
        <Skeleton key={key} className="h-[120px] rounded-lg bg-surface" />
      ))}
    </div>
    <div className={LAYOUT}>
      <Skeleton className="h-[380px] rounded-lg bg-surface" />
      <Skeleton className="h-[380px] rounded-lg bg-surface" />
    </div>
  </>
);

const HasilSimulasiContainer = () => {
  const {
    result,
    response,
    selected,
    selectedKey,
    isSelectedUsable,
    cheapest,
    alternative,
    isLoading,
    loadError,
    canRetry,
    retry,
    handleDownloadSummaryCsv,
    handleDownloadJson,
    handleDownloadDispatch,
    handleDownloadDaily,
    handlePrint,
    handleSelectScenario,
    handleBackToInput,
    handleNewSimulation,
    handleEditField,
  } = useHasilSimulasiContainer();

  const project = result?.input.project;

  let hero: React.ReactNode = <HasilSimulasiHero />;
  if (response && project) {
    const where = [project.name, project.location].filter(Boolean).join(", ");
    hero = (
      <HasilSimulasiHero
        title={`Hasil optimasi sistem energi${where ? ` untuk ${where}` : ""}`}
        description={`${DEFAULT_DESCRIPTION} ${result.source === "backend" ? "Dihitung backend (Offgridders)" : "Dihitung mock FE, bukan Offgridders"}, periode ${formatNumber(response.period_days)} hari, ${formatNumber(response.time_step_hours)} jam per interval.`}
        aside={
          <HeroResultPanel
            label={cheapest ? "LCOE terendah" : "Status solver"}
            title={
              cheapest
                ? SCENARIO_META[cheapest.scenario_id].label
                : "Tidak ada skenario dengan solusi"
            }
            note={
              cheapest?.metrics.lcoe != null
                ? `${formatNumber(cheapest.metrics.lcoe, cheapest.metrics.lcoe < 10 ? 5 : 2)} ${response.units.lcoe}`
                : `Status ${response.status}`
            }
            noteClassName={cheapest ? "text-success" : "text-danger"}
            onDownloadCsv={handleDownloadSummaryCsv}
          />
        }
      />
    );
  }

  return (
    <>
      {hero}

      {isLoading && <HasilSimulasiSkeleton />}

      {loadError && (
        <LoadErrorPanel
          title="Hasil simulasi tidak dapat dimuat"
          message={loadError}
          onRetry={canRetry ? () => retry() : undefined}
          onBack={handleBackToInput}
        />
      )}

      {result && response && selected && selectedKey && (
        <>
          <ResultStatusBanner
            response={response}
            source={result.source}
            fallback={result.fallback}
          />

          <ScenarioTabs
            response={response}
            value={selectedKey}
            onChange={handleSelectScenario}
          />

          {isSelectedUsable ? (
            <>
              <KpiGrid metrics={selected.metrics} units={response.units} />

              <div className={LAYOUT}>
                <div className="flex min-w-0 flex-col gap-5">
                  <OperasiEnergiSection
                    scenario={selected}
                    periodDays={response.period_days}
                    stepHours={response.time_step_hours}
                  />
                  <PerbandinganSection
                    response={response}
                    selected={selectedKey}
                    onSelect={handleSelectScenario}
                  />
                  <RingkasanEnergiSection
                    metrics={selected.metrics}
                    periodDays={response.period_days}
                  />
                </div>
                <aside className="flex min-w-0 flex-col gap-5">
                  <KapasitasSection scenario={selected} />
                  <KecukupanSection
                    metrics={selected.metrics}
                    targetFraction={
                      result.input.reliability.target_supply_fraction
                    }
                  />
                  <ValidasiSection
                    scenario={selected}
                    units={response.units}
                    expectedIntervals={
                      (response.period_days * 24) / response.time_step_hours
                    }
                  />
                  <EksporSection
                    hasDispatch={selected.dispatch.length > 0}
                    periodDays={response.period_days}
                    onDownloadJson={handleDownloadJson}
                    onDownloadDispatch={handleDownloadDispatch}
                    onDownloadDaily={handleDownloadDaily}
                    onPrint={handlePrint}
                  />
                </aside>
              </div>

              <HasilFooter
                onBackToInput={handleBackToInput}
                onNewSimulation={handleNewSimulation}
              />
            </>
          ) : (
            <InfeasibleView
              scenario={selected}
              input={result.input}
              units={response.units}
              alternative={alternative}
              onEditField={handleEditField}
              onSelectScenario={handleSelectScenario}
              onBackToInput={handleBackToInput}
            />
          )}
        </>
      )}
    </>
  );
};

export default HasilSimulasiContainer;
