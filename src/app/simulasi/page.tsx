import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import InputSimulasiContainer, {
  InputSimulasiHero,
  InputSimulasiSkeleton,
} from "@/feature/input-simulasi/container/InputSimulasiContainer";

export const metadata: Metadata = {
  title: "Konfigurasi sistem energi desa",
};

// useFieldArray membuat id baris acak saat render, jadi form tidak boleh
// diprerender (cacheComponents aktif): form di-stream per request.
const DynamicInputSimulasi = async () => {
  await connection();
  return <InputSimulasiContainer />;
};

export default function SimulasiPage() {
  return (
    <>
      <InputSimulasiHero />
      <Suspense fallback={<InputSimulasiSkeleton />}>
        <DynamicInputSimulasi />
      </Suspense>
    </>
  );
}
