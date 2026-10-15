import type { Metadata } from "next";
import { Suspense } from "react";
import ProsesSolverContainer, {
  ProsesSolverHero,
  ProsesSolverSkeleton,
} from "@/feature/proses-solver/container/ProsesSolverContainer";

export const metadata: Metadata = {
  title: "Menjalankan optimasi",
};

export default function ProsesSolverPage() {
  return (
    // useSearchParams() butuh Suspense boundary (cacheComponents aktif).
    <Suspense
      fallback={
        <>
          <ProsesSolverHero />
          <ProsesSolverSkeleton />
        </>
      }
    >
      <ProsesSolverContainer />
    </Suspense>
  );
}
