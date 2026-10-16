"use client";

import { Skeleton } from "@/components/ui/skeleton";
import LoadErrorPanel from "@/shared/component/LoadErrorPanel";
import PageHero from "@/shared/component/PageHero";
import SolverLogPanel from "@/shared/component/SolverLogPanel";
import ScenarioProgressPanel from "../component/ScenarioProgressPanel";
import SolverBanner from "../component/SolverBanner";
import SolverFooter from "../component/SolverFooter";
import { useProsesSolverContainer } from "../hooks/useProsesSolverContainer";

export const ProsesSolverHero = () => (
  <PageHero
    size="md"
    eyebrow="Simulasi · memproses"
    title="Menjalankan optimasi"
    description="Skenario yang dipilih sedang dioptimasi. Halaman pindah otomatis ke Hasil saat selesai."
  />
);

export const ProsesSolverSkeleton = () => (
  <>
    <Skeleton className="h-[84px] w-full rounded-md bg-surface" />
    <Skeleton className="h-[160px] w-full rounded-lg bg-surface" />
    <Skeleton className="h-[220px] w-full rounded-lg bg-surface" />
  </>
);

const ProsesSolverContainer = () => {
  const {
    progress,
    isLoading,
    loadError,
    retry,
    canViewResult,
    isCancelling,
    handleCancel,
    handleBackToInput,
    handleViewResult,
  } = useProsesSolverContainer();

  return (
    <>
      <ProsesSolverHero />

      {isLoading && <ProsesSolverSkeleton />}

      {loadError && !progress && (
        <LoadErrorPanel
          title="Progres solver tidak dapat dimuat"
          message={loadError}
          onRetry={() => retry()}
          onBack={handleBackToInput}
        />
      )}

      {progress && (
        <>
          <SolverBanner progress={progress} />
          <ScenarioProgressPanel progress={progress} />
          <SolverLogPanel logs={progress.logs} />
          <SolverFooter
            status={progress.status}
            canViewResult={canViewResult}
            isCancelling={isCancelling}
            onCancel={handleCancel}
            onBackToInput={handleBackToInput}
            onViewResult={handleViewResult}
          />
        </>
      )}
    </>
  );
};

export default ProsesSolverContainer;
