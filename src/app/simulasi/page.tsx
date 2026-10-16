import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import InputSimulasiContainer, {
  InputSimulasiHero,
} from "@/feature/input-simulasi/container/InputSimulasiContainer";

export const metadata: Metadata = {
  title: "Atur skenario energi desa",
};

export default function SimulasiPage() {
  return (
    // useSearchParams() (?dari=) butuh Suspense boundary (cacheComponents aktif).
    <Suspense
      fallback={
        <>
          <InputSimulasiHero />
          <Skeleton className="h-[480px] w-full rounded-lg bg-surface" />
        </>
      }
    >
      <InputSimulasiContainer />
    </Suspense>
  );
}
