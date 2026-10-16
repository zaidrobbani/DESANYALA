"use client";

import type React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import LoadErrorPanel from "@/shared/component/LoadErrorPanel";
import PageHero from "@/shared/component/PageHero";
import AliranEnergiSection from "../component/AliranEnergiSection";
import DetailSection from "../component/DetailSection";
import HasilFooter from "../component/HasilFooter";
import KecukupanSection from "../component/KecukupanSection";
import KonfigurasiSection from "../component/KonfigurasiSection";
import PerbandinganSection from "../component/PerbandinganSection";
import RecommendationPanel from "../component/RecommendationPanel";
import ResultSolverBanner from "../component/ResultSolverBanner";
import RingkasanBiayaSection from "../component/RingkasanBiayaSection";
import SolarSection from "../component/SolarSection";
import { useHasilSimulasiContainer } from "../hooks/useHasilSimulasiContainer";

const ROW_WIDE_LEFT = "grid gap-5 xl:grid-cols-[minmax(0,1fr)_520px]";
const ROW_WIDE_RIGHT = "grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]";

interface HasilSimulasiHeroProps {
  villageName?: string;
  aside?: React.ReactNode;
}

export const HasilSimulasiHero = ({
  villageName,
  aside,
}: HasilSimulasiHeroProps) => (
  <PageHero
    eyebrow="Hasil simulasi · langkah 2 dari 2"
    title={
      villageName
        ? `Rekomendasi konfigurasi energi untuk ${villageName}`
        : "Rekomendasi konfigurasi energi"
    }
    description="Hasil optimasi berdasarkan data dan asumsi yang kamu masukkan. Periksa konfigurasi, biaya, dan kecukupan pasokan sebelum dipakai di proposal."
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
    result,
    summary,
    loadProfileLabel,
    isLoading,
    loadError,
    canRetry,
    retry,
    handleDownloadCsv,
    handleBackToInput,
  } = useHasilSimulasiContainer();

  return (
    <>
      <HasilSimulasiHero
        villageName={result?.input.location.village_name}
        aside={
          summary && (
            <RecommendationPanel
              summary={summary}
              onDownloadCsv={handleDownloadCsv}
            />
          )
        }
      />

      {isLoading && <HasilSimulasiSkeleton />}

      {loadError && (
        <LoadErrorPanel
          title="Hasil simulasi tidak dapat dimuat"
          message={loadError}
          onRetry={canRetry ? () => retry() : undefined}
          onBack={handleBackToInput}
        />
      )}

      {result && summary && (
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
              scenario={summary.hybrid}
              maxUnservedPct={result.input.max_unserved_energy_pct}
            />
            <AliranEnergiSection summary={summary} />
          </div>

          <DetailSection
            components={summary.components}
            input={result.input}
            loadProfileLabel={loadProfileLabel}
          />

          <HasilFooter
            onBackToInput={handleBackToInput}
            onNewSimulation={handleBackToInput}
          />
        </>
      )}
    </>
  );
};

export default HasilSimulasiContainer;
