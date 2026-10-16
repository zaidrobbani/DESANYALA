import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageHero from "@/shared/component/PageHero";
import { ROUTES } from "@/shared/constant/routes";

export const metadata: Metadata = {
  title: "Hasil simulasi",
};

// PLACEHOLDER: halaman Hasil (Figma frame 02, 02b–d, 04) belum di-slice.
// Disediakan agar redirect dari halaman proses solver tidak 404.
export default function HasilSimulasiPage() {
  return (
    <>
      <PageHero
        size="md"
        eyebrow="Simulasi · langkah 2 dari 2"
        title="Hasil simulasi"
        description="Halaman hasil belum tersedia di build ini."
      />
      <section className="flex flex-col items-start gap-3 rounded-lg bg-surface p-6">
        <p className="text-body text-fg-secondary">
          Optimasi sudah selesai. Tampilan perbandingan antarskenario akan
          dikerjakan pada tahap berikutnya.
        </p>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-md border-line-strong px-4 text-body-strong"
        >
          <Link href={ROUTES.simulasi}>Kembali ke input</Link>
        </Button>
      </section>
    </>
  );
}
