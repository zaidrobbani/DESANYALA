import Image from "next/image";
import type React from "react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  meta?: React.ReactNode;
  /** Konten di sisi kanan hero (mis. panel rekomendasi). */
  aside?: React.ReactNode;
  credit?: string;
  size?: "lg" | "md";
  className?: string;
}

const PageHero = ({
  eyebrow,
  title,
  description,
  meta,
  aside,
  credit = "Foto: Simon Spring / Unsplash",
  size = "lg",
  className,
}: PageHeroProps) => {
  return (
    <section
      className={cn(
        "relative isolate flex w-full flex-col justify-center overflow-hidden rounded-xl px-6 sm:px-12",
        size === "lg" ? "py-10 sm:py-14" : "py-8 sm:py-10",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/images/hero-raja-ampat.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1440px) 1392px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-scrim" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2.5 text-fg-inverse">
          <p className="text-small opacity-88">{eyebrow}</p>
          <h1 className="text-h1">{title}</h1>
          <p className="max-w-[640px] text-body opacity-88">{description}</p>
          {meta && (
            <p className="max-w-[640px] text-small opacity-88">{meta}</p>
          )}
        </div>
        {aside}
      </div>

      {credit && (
        <p className="absolute right-4 bottom-3 text-[11px] text-fg-inverse leading-[18px] opacity-70 sm:right-6">
          {credit}
        </p>
      )}
    </section>
  );
};

export default PageHero;
