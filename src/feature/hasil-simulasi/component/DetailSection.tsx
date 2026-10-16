import { IconListDetails } from "@tabler/icons-react";
import type React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  ComponentResult,
  SimulationRequest,
} from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import {
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@/shared/component/SegmentedTabs";
import {
  formatIdrCompact,
  formatNumber,
  formatPercent,
} from "@/shared/util/number";
import { COMPONENT_META, COMPONENT_ORDER, DETAIL_TABS } from "../data";
import { formatCapacity } from "../util/summarize-result";

const HEAD_ROW = "border-line-strong border-b hover:bg-transparent";
const HEAD_CELL = "h-auto px-1 py-3 text-fg-secondary text-label";
const BODY_ROW = "border-line border-b hover:bg-transparent";
const BODY_CELL = "px-1 py-3 text-fg-primary";

/* ------------------------------------------------------------------------ */

const ComponentName = ({ component }: { component: ComponentResult }) => {
  const meta = COMPONENT_META[component.key];
  return (
    <span className="flex items-center gap-2.5">
      <meta.icon
        aria-hidden
        className={cn("size-[18px] shrink-0", meta.iconClass)}
        stroke={1.75}
      />
      <span className="text-body-strong">{meta.label}</span>
    </span>
  );
};

const capacityText = (component: ComponentResult) =>
  `${formatCapacity(component, (v) => formatNumber(v, 1))} ${component.unit}`;

interface DataTableProps {
  columns: { label: string; className?: string }[];
  rows: { key: string; cells: React.ReactNode[] }[];
}

/** Tabel detail (Figma: Table): garis bawah saja, tanpa latar baris. */
const DataTable = ({ columns, rows }: DataTableProps) => (
  <Table className="min-w-[640px]">
    <TableHeader>
      <TableRow className={HEAD_ROW}>
        {columns.map((column) => (
          <TableHead
            key={column.label}
            className={cn(HEAD_CELL, column.className)}
          >
            {column.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody className="[&_tr:last-child]:border-b">
      {rows.map((row) => (
        <TableRow key={row.key} className={BODY_ROW}>
          {row.cells.map((cell, index) => (
            <TableCell
              // biome-ignore lint/suspicious/noArrayIndexKey: kolom tetap per tabel
              key={index}
              className={cn(BODY_CELL, columns[index]?.className)}
            >
              {cell}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

/* ------------------------------------------------------------------------ */

const ringkasanTable = (components: ComponentResult[]): DataTableProps => ({
  columns: [
    { label: "Komponen" },
    { label: "Kapasitas", className: "w-[200px]" },
    { label: "Biaya investasi (estimasi)", className: "w-[240px]" },
    { label: "Energi dipasok", className: "w-[320px]" },
  ],
  rows: components.map((component) => {
    const investment =
      component.investment_idr === null
        ? null
        : formatIdrCompact(component.investment_idr, 2);
    return {
      key: component.key,
      cells: [
        <ComponentName key="name" component={component} />,
        <span key="cap" className="text-value">
          {capacityText(component)}
        </span>,
        <span key="capex" className="text-value">
          {investment ? `${investment.value} ${investment.unit}` : "Eksisting"}
        </span>,
        <span key="share" className="text-body">
          {component.energy_share_pct === null
            ? COMPONENT_META[component.key].role
            : `${formatPercent(component.energy_share_pct)} dari kebutuhan`}
        </span>,
      ],
    };
  }),
});

const juta = (idr: number, unit: string) =>
  `${formatNumber(idr / 1_000_000, 1)} juta Rp/${unit}`;

const komponenTable = (
  components: ComponentResult[],
  input: SimulationRequest,
): DataTableProps => {
  const { pv, battery, diesel, economics } = input;
  const unitPrice: Record<ComponentResult["key"], string> = {
    pv: juta(economics.capex_pv_idr_per_kwp, "kWp"),
    battery: juta(economics.capex_battery_idr_per_kwh, "kWh"),
    inverter: juta(economics.capex_inverter_idr_per_kw, "kW"),
    diesel: "Eksisting",
  };
  const spec: Record<ComponentResult["key"], string> = {
    pv: `Radiasi ${formatNumber(pv.avg_irradiance_kwh_m2_day)} kWh/m²/hari · umur ${formatNumber(pv.lifetime_years)} tahun`,
    battery: `SOC min ${formatNumber(battery.min_soc_pct)} % · efisiensi ${formatNumber(battery.round_trip_efficiency_pct)} %`,
    inverter: COMPONENT_META.inverter.role,
    diesel: `Beban min ${formatNumber(diesel.min_load_pct)} % · ${formatNumber(diesel.specific_consumption_l_per_kwh)} liter/kWh`,
  };

  return {
    columns: [
      { label: "Komponen" },
      { label: "Kapasitas", className: "w-[200px]" },
      { label: "Harga satuan", className: "w-[240px]" },
      { label: "Spesifikasi", className: "w-[320px]" },
    ],
    rows: components.map((component) => ({
      key: component.key,
      cells: [
        <ComponentName key="name" component={component} />,
        <span key="cap" className="text-value">
          {capacityText(component)}
        </span>,
        <span key="price" className="text-value">
          {unitPrice[component.key]}
        </span>,
        <span key="spec" className="text-body">
          {spec[component.key]}
        </span>,
      ],
    })),
  };
};

const parameterTable = (
  input: SimulationRequest,
  loadProfileLabel: string,
): DataTableProps => {
  const { location, economics, pv, battery } = input;
  const rows: [string, string][] = [
    [
      "Lokasi",
      `${location.village_name}, ${location.province} (${location.timezone})`,
    ],
    ["Profil beban", loadProfileLabel],
    ["Kapasitas maks panel surya", `${formatNumber(pv.max_capacity_kwp)} kWp`],
    ["Kapasitas maks baterai", `${formatNumber(battery.max_capacity_kwh)} kWh`],
    [
      "Harga solar",
      `${formatNumber(economics.diesel_price_idr_per_liter)} Rp/liter`,
    ],
    ["Umur proyek", `${formatNumber(economics.project_lifetime_years)} tahun`],
    ["Tingkat diskonto", `${formatNumber(economics.discount_rate_pct)} %`],
    ["Kurs", `${formatNumber(economics.usd_idr_rate)} Rp/USD`],
    [
      "Batas beban tak terlayani",
      `${formatNumber(input.max_unserved_energy_pct)} %`,
    ],
  ];

  return {
    columns: [
      { label: "Parameter" },
      { label: "Nilai", className: "w-[560px]" },
    ],
    rows: rows.map(([label, value]) => ({
      key: label,
      cells: [
        <span key="label" className="text-body-strong">
          {label}
        </span>,
        <span key="value" className="text-value">
          {value}
        </span>,
      ],
    })),
  };
};

/* ------------------------------------------------------------------------ */

interface DetailSectionProps {
  components: ComponentResult[];
  input: SimulationRequest;
  loadProfileLabel: string;
}

const DetailSection = ({
  components,
  input,
  loadProfileLabel,
}: DetailSectionProps) => {
  const ordered = COMPONENT_ORDER.flatMap(
    (key) => components.find((component) => component.key === key) ?? [],
  );
  const tables: Record<(typeof DETAIL_TABS)[number]["value"], DataTableProps> =
    {
      ringkasan: ringkasanTable(ordered),
      komponen: komponenTable(ordered, input),
      parameter: parameterTable(input, loadProfileLabel),
    };

  return (
    <Tabs defaultValue="ringkasan" className="w-full gap-0">
      <SectionCard
        icon={IconListDetails}
        title="Detail komponen & parameter"
        action={
          <SegmentedTabsList aria-label="Tampilan detail">
            {DETAIL_TABS.map((tab) => (
              <SegmentedTabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </SegmentedTabsTrigger>
            ))}
          </SegmentedTabsList>
        }
        className="gap-4"
      >
        {DETAIL_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            <DataTable {...tables[tab.value]} />
          </TabsContent>
        ))}
        <p className="text-fg-tertiary text-small">
          Biaya investasi dihitung dari asumsi harga di bagian 4 Input, sehingga
          bisa berbeda dari CAPEX benchmark paper.
        </p>
      </SectionCard>
    </Tabs>
  );
};

export default DetailSection;
