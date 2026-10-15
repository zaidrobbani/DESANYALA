export const ROUTES = {
  beranda: "/",
  simulasi: "/simulasi",
  simulasiProses: (id: string) =>
    `/simulasi/proses?id=${encodeURIComponent(id)}`,
  simulasiHasil: (id: string) => `/simulasi/hasil?id=${encodeURIComponent(id)}`,
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
