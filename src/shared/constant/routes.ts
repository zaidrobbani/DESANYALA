export const ROUTES = {
  beranda: "/",
  simulasi: "/simulasi",
  /** Input yang diisi ulang dari run `id`, opsional fokus ke satu field. */
  simulasiDari: (id: string, field?: string) =>
    `/simulasi?dari=${encodeURIComponent(id)}${field ? `&fokus=${encodeURIComponent(field)}` : ""}`,
  simulasiProses: (id: string) =>
    `/simulasi/proses?id=${encodeURIComponent(id)}`,
  simulasiHasil: (id: string, view?: "baseline") =>
    `/simulasi/hasil?id=${encodeURIComponent(id)}${view ? `&view=${view}` : ""}`,
  research: "/research",
} as const;

export const NAV_ITEMS = [
  { label: "Beranda", href: ROUTES.beranda, match: (p: string) => p === "/" },
  {
    label: "Simulasi",
    href: ROUTES.simulasi,
    match: (p: string) => p.startsWith(ROUTES.simulasi),
  },
  {
    label: "Research & data",
    href: ROUTES.research,
    match: (p: string) => p.startsWith(ROUTES.research),
  },
] as const;
