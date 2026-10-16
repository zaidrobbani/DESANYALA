import type { Metadata } from "next";
import { Suspense } from "react";
import HasilSimulasiContainer, {
  HasilSimulasiHero,
  HasilSimulasiSkeleton,
} from "@/feature/hasil-simulasi/container/HasilSimulasiContainer";

export const metadata: Metadata = {
  title: "Hasil simulasi",
};

export default function HasilSimulasiPage() {
  return (
    // useSearchParams() butuh Suspense boundary (cacheComponents aktif).
    <Suspense
      fallback={
        <>
          <HasilSimulasiHero />
          <HasilSimulasiSkeleton />
        </>
      }
    >
      <HasilSimulasiContainer />
    </Suspense>
  );
}
