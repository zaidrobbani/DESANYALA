"use client";

import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHero from "@/shared/component/PageHero";
import ScenarioProgressPanel from "../component/ScenarioProgressPanel";
import SolverBanner from "../component/SolverBanner";
import SolverFooter from "../component/SolverFooter";
import SolverLogPanel from "../component/SolverLogPanel";
import { useProsesSolverContainer } from "../hooks/useProsesSolverContainer";

export const ProsesSolverHero = () => (
  <PageHero
    size="md"
    eyebrow="Simulasi · memproses"
    title="Menjalankan optimasi"
    description="Baseline dan Hybrid dijalankan berurutan pada beban yang sama. Halaman pindah otomatis ke Hasil saat selesai."
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
        <section
          role="alert"
          className="flex w-full flex-col items-start gap-3 rounded-md bg-surface px-4 py-3.5 sm:flex-row sm:items-center"
        >
          <IconAlertTriangle
            aria-hidden
            className="size-[18px] shrink-0 text-danger"
            stroke={1.75}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 className="text-body-strong text-danger">
              Progres solver tidak dapat dimuat
            </h2>
            <p className="text-fg-primary text-small">{loadError}</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => retry()}
              className="h-10 rounded-md border-line-strong px-4 text-body-strong"
            >
              Coba lagi
            </Button>
            <Button
              type="button"
              onClick={handleBackToInput}
              className="h-10 gap-2 rounded-md px-4 text-body-strong hover:bg-brand-hover"
            >
              <IconArrowLeft aria-hidden className="size-4" stroke={1.75} />
              Ke input
            </Button>
          </div>
        </section>
      )}

      {progress && (
        <>
          <SolverBanner progress={progress} />
          <ScenarioProgressPanel progress={progress} />
          <SolverLogPanel logs={progress.logs} />
          <SolverFooter
            status={progress.status}
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
