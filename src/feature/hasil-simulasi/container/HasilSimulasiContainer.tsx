"use client";

import type React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import LoadErrorPanel from "@/shared/component/LoadErrorPanel";
import PageHero from "@/shared/component/PageHero";
import { formatPercent } from "@/shared/util/number";
import AliranEnergiSection from "../component/AliranEnergiSection";
import BaselineView from "../component/BaselineView";
import DetailSection from "../component/DetailSection";
import HasilFooter from "../component/HasilFooter";
import HeroResultPanel from "../component/HeroResultPanel";
import InfeasibleView from "../component/InfeasibleView";
import KecukupanSection from "../component/KecukupanSection";
import KonfigurasiSection from "../component/KonfigurasiSection";
import PerbandinganSection from "../component/PerbandinganSection";
import ResultSolverBanner from "../component/ResultSolverBanner";
import RingkasanBiayaSection from "../component/RingkasanBiayaSection";
import SolarSection from "../component/SolarSection";
import { SCENARIO_META } from "../data";
import { useHasilSimulasiContainer } from "../hooks/useHasilSimulasiContainer";

const ROW_WIDE_LEFT = "grid gap-5 xl:grid-cols-[minmax(0,1fr)_520px]";
const ROW_WIDE_RIGHT = "grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]";

const DEFAULT_DESCRIPTION =
  "Hasil optimasi berdasarkan data dan asumsi yang kamu masukkan. Periksa konfigurasi, biaya, dan kecukupan pasokan sebelum dipakai di proposal.";

interface HasilSimulasiHeroProps {
  title?: string;
  description?: string;
  size?: "lg" | "md";
  aside?: React.ReactNode;
}

export const HasilSimulasiHero = ({
  title = "Rekomendasi konfigurasi energi",
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
    <div className={ROW_WIDE_LEFT}>
      <Skeleton className="h-[230px] rounded-lg bg-surface" />
      <Skeleton className="h-[230px] rounded-lg bg-surface" />
    </div>
    <div className={ROW_WIDE_LEFT}>
      <Skeleton className="h-[380px] rounded-lg bg-surface" />
      <Skeleton className="h-[380px] rounded-lg bg-surface" />
    </div>
  </>
);

const HasilSimulasiContainer = () => {
  const {
    view,
    result,
    summary,
    baseline,
    loadProfileLabel,
    isLoading,
    loadError,
    canRetry,
    retry,
    handleDownloadCsv,
    handleBackToInput,
    handleNewSimulation,
    handleEditField,
    handleViewBaseline,
    handleBackToDiagnosis,
  } = useHasilSimulasiContainer();

  const village = result?.input.location.village_name;
  const failure = result?.failed_scenario ?? null;

  let hero: React.ReactNode = <HasilSimulasiHero />;
  if (view === "comparison" && summary) {
    const isCheaper = summary.lcoeReductionPct > 0;
    hero = (
      <HasilSimulasiHero
        title={`Rekomendasi konfigurasi energi untuk ${village}`}
        aside={
          <HeroResultPanel
            label="Skenario direkomendasikan"
            title={SCENARIO_META[summary.recommended.key].label}
            note={
              isCheaper
                ? `LCOE ${formatPercent(summary.lcoeReductionPct)} lebih rendah dari diesel saja`
                : "Hybrid belum lebih murah dari diesel saja"
            }
            noteClassName={isCheaper ? "text-success" : undefined}
            onDownloadCsv={handleDownloadCsv}
          />
        }
      />
    );
  } else if (view === "infeasible" && failure) {
    const failedName = SCENARIO_META[failure.key].name.toLowerCase();
    hero = (
      <HasilSimulasiHero
        size="md"
        title={`Skenario ${failedName} tidak menemukan solusi`}
        description={`Hasil ${failedName} sengaja tidak ditampilkan agar tidak menyesatkan. Perbaiki parameter bertanda, lalu jalankan ulang.`}
      />
    );
  } else if (view === "baseline") {
    hero = (
      <HasilSimulasiHero
        title={`Hasil diesel saja untuk ${village}`}
        description={
          failure
            ? "Skenario hybrid tidak menemukan solusi, jadi yang tampil hanya diesel saja sebagai pembanding."
            : "Hanya skenario diesel saja yang dijalankan. Aktifkan hybrid di input untuk melihat rekomendasi panel surya dan baterai."
        }
        aside={
          <HeroResultPanel
            label="Skenario ditampilkan"
            title={SCENARIO_META.baseline.label}
            note="Status optimal"
            noteClassName="text-success"
            onDownloadCsv={handleDownloadCsv}
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

      {result && view === "infeasible" && failure && (
        <InfeasibleView
          result={result}
          failure={failure}
          baseline={baseline}
          onEditField={handleEditField}
          onViewBaseline={handleViewBaseline}
          onBackToInput={handleBackToInput}
        />
      )}

      {result && view === "baseline" && baseline && (
        <BaselineView
          result={result}
          baseline={baseline}
          onBackToDiagnosis={failure ? handleBackToDiagnosis : undefined}
          onBackToInput={handleBackToInput}
          onNewSimulation={handleNewSimulation}
        />
      )}

      {result && view === "comparison" && summary && (
        <>
          <ResultSolverBanner result={result} />

          <div className={ROW_WIDE_LEFT}>
            <KonfigurasiSection components={summary.components} />
            <RingkasanBiayaSection
              summary={summary}
              economics={result.input.economics}
            />
          </div>

          <div className={ROW_WIDE_LEFT}>
            <PerbandinganSection summary={summary} />
            <SolarSection
              summary={summary}
              specificConsumption={
                result.input.diesel.specific_consumption_l_per_kwh
              }
            />
          </div>

          <div className={ROW_WIDE_RIGHT}>
            <KecukupanSection
              number={5}
              scenario={summary.hybrid}
              maxUnservedPct={result.input.max_unserved_energy_pct}
            />
            <AliranEnergiSection
              number={6}
              scenarios={[summary.baseline, summary.hybrid]}
            />
          </div>

          <DetailSection
            components={summary.components}
            input={result.input}
            loadProfileLabel={loadProfileLabel}
          />

          <HasilFooter
            onBackToInput={handleBackToInput}
            onNewSimulation={handleNewSimulation}
          />
        </>
      )}
    </>
  );
};

export default HasilSimulasiContainer;
