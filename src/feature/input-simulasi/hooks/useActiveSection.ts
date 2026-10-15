import { useEffect, useState } from "react";

/**
 * Pantau section yang sedang dibaca pengguna (untuk stepper).
 * Section dianggap aktif saat melewati garis ~35% dari atas viewport.
 */
export const useActiveSection = <T extends string>(ids: readonly T[]) => {
  const [activeId, setActiveId] = useState<T>(ids[0]);
  const idsKey = ids.join("|");

  useEffect(() => {
    const sectionIds = idsKey.split("|") as T[];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting);
        }
        const firstVisible = sectionIds.find((id) => visible.get(id));
        if (firstVisible) setActiveId(firstVisible);
      },
      { rootMargin: "-35% 0px -60% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [idsKey]);

  return [activeId, setActiveId] as const;
};
