import type React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Wadah segmented control (Figma: Toggle) di atas `<Tabs>`. */
export const SegmentedTabsList = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) => (
  <TabsList
    className={cn("h-auto gap-0.5 rounded-lg bg-subtle p-[3px]", className)}
    {...props}
  />
);

/** Item segmented control (Figma: Segment). */
export const SegmentedTabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) => (
  <TabsTrigger
    className={cn(
      "h-auto flex-none rounded-md px-3.5 py-1.5 text-body-strong text-fg-secondary shadow-none hover:text-fg-primary data-[state=active]:bg-surface data-active:bg-surface data-[state=active]:text-brand data-active:text-brand data-[state=active]:shadow-none data-active:shadow-none",
      className,
    )}
    {...props}
  />
);
