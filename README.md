# DesaNyala FE

Frontend DesaNyala: simulasi dan optimasi sistem energi desa, membandingkan **diesel saja (baseline)** dengan **diesel + panel surya + baterai (hybrid)** pada beban yang sama.

Desain: [Figma DESANYALA](https://www.figma.com/design/fSuDUVYlm7vOzb3jd3AdWP/DESANYALA?node-id=38-748)

## Scope saat ini

| Halaman | Route | Frame Figma | Status |
| --- | --- | --- | --- |
| Input simulasi (contoh & input manual) | `/simulasi` | 01, 01b | Selesai |
| Proses solver (berjalan, selesai, gagal) | `/simulasi/proses?id=` | 03, 03b | Selesai |
| Hasil simulasi | `/simulasi/hasil?id=` | 02 | Selesai (tab Komponen & Parameter sementara, menunggu frame 02b–d) |
| Hasil infeasible (diagnosis) | `/simulasi/hasil?id=` | 04 | Selesai |
| Hasil diesel saja | `/simulasi/hasil?id=&view=baseline` | – | Selesai (dirakit dari section yang ada, belum ada frame) |

`/` sementara di-redirect ke `/simulasi` karena halaman Beranda belum di-slice.

### Mencoba alur demo (mock API)

1. Buka `/simulasi`, lalu klik **Jalankan optimasi** dengan nilai default. Kedua skenario selesai *optimal* dalam ±14 detik, lalu halaman pindah otomatis ke Hasil. Tombol **Unduh hasil CSV** mengekspor ringkasan dan dispatch hari tipikal.
2. **Skenario gagal (frame 03b):** ubah *Kapasitas terpasang* diesel menjadi `2 × 30` (60 kW < beban puncak 77,90 kW) lalu jalankan. Baseline akan *infeasible* dan Hybrid dilewati. Cara lain: set `NEXT_PUBLIC_MOCK_SOLVER_RESULT=fail`.
3. **Hybrid infeasible (frame 04):** ubah *Minimum load per unit* menjadi `90` lalu jalankan. Baseline optimal, hybrid infeasible saat presolve, dan halaman pindah ke Hasil yang berisi diagnosis. Dari sana, **Ubah di input** membuka form berisi nilai run tersebut dan langsung fokus ke field yang bermasalah, sedangkan **Lihat hasil baseline** menampilkan hasil diesel saja. Cara lain: set `NEXT_PUBLIC_MOCK_SOLVER_RESULT=fail-hybrid`.
4. Tombol **Batalkan** menghentikan solver yang sedang berjalan.

## Tech stack

- **Next.js 16** (App Router, React 19, React Compiler) + **TypeScript**
- **Bun** sebagai package manager & runner
- **Tailwind CSS v4** + **shadcn/ui** (style `radix-nova`, base Radix, semua komponen terpasang di `src/components/ui`)
- **Biome** untuk lint & format (menggantikan ESLint/Prettier)
- **Axios** + **TanStack Query** untuk data fetching
- **Zod** + **react-hook-form** untuk validasi form
- **@tabler/icons-react** (ikon di Figma memakai Tabler)
- **Lefthook** + **commitlint** untuk git hooks

## Memulai

```bash
bun install          # otomatis menjalankan `lefthook install` (script prepare)
cp .env.example .env.local
bun run dev          # http://localhost:3000
```

### Environment

| Variabel | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_BASE_API_URL` | Base URL backend. Kosong = mock API otomatis aktif. |
| `NEXT_PUBLIC_USE_MOCK_API` | `true` untuk memaksa mock walau base URL terisi. |
| `NEXT_PUBLIC_MOCK_SOLVER_RESULT` | `auto` / `success` / `fail` / `fail-hybrid`. Saat batas beban tak terlayani = 0, `auto` membuat baseline *infeasible* bila kapasitas diesel < beban puncak, atau hybrid *infeasible* bila minimum load genset ≥ 60 %. |

## Scripts

| Script | Fungsi |
| --- | --- |
| `bun run dev` | Dev server |
| `bun run build` | Production build |
| `bun run start` | Jalankan hasil build |
| `bun run lint` | `biome lint` |
| `bun run format` | `biome format --write` |
| `bun run check` | `biome check --write` (lint + format + organize imports) |
| `bun run typecheck` | `tsc --noEmit` |

## Struktur folder (feature-based, mengikuti simaba-2026-internal)

```
src/
├── app/                    # Routing Next.js saja, page hanya merender container
├── feature/<nama>/         # Satu folder per halaman/fitur
│   ├── container/          # Komponen utama halaman (merakit component/)
│   ├── component/          # Komponen UI khusus fitur
│   ├── hooks/              # use<Nama>Container: state, query, handler
│   ├── util/               # Helper khusus fitur
│   └── data.ts             # Konstanta, default value, konfigurasi field
├── repository/<domain>/    # Layer API
│   ├── dto.ts              # Tipe request/response
│   ├── action.ts           # Fungsi axios (+ fallback mock)
│   ├── query.ts            # Hook TanStack Query
│   └── mock.ts             # Mock API sementara backend belum siap
├── schemas/<domain>/       # Zod schema
├── shared/
│   ├── component/          # Komponen reusable lintas fitur (PageHero, NumberField, ...)
│   ├── constant/           # Route, nav
│   └── util/               # Format angka id-ID, skala profil beban
├── layout/                 # TopNav, MainLayout, QueryProvider
├── lib/                    # axios, env, try-catch, utils
├── components/ui/          # shadcn (vendor, tidak di-lint Biome)
└── hooks/                  # Hook bawaan shadcn
```

## Design system

Semua token ada di `src/app/globals.css`, diambil dari variable Figma yang terpasang di screen:

- **Token mentah** memakai nama yang sama dengan Figma: `--bg-canvas`, `--brand-primary`, `--energy-pv`, `--status-warning`, dan seterusnya.
- **Token shadcn** (`--primary`, `--border`, `--chart-1`, dan seterusnya) dipetakan ke token DesaNyala.
- **Utility Tailwind**:
  - warna: `bg-canvas`, `bg-surface`, `bg-subtle`, `bg-track`, `text-fg-primary|secondary|tertiary|inverse`, `text-brand`, `border-line`, `border-line-strong`, `text-energy-*`, `text-success|warning|danger`, `text-source-paper`
  - tipografi (Figma text styles): `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-body-strong`, `text-small`, `text-label`, `text-label-meta`, `text-kpi`, `text-value`, `text-num-sm`, `text-code` (pakai bersama `font-mono`)
  - radius: `rounded-sm` 4 · `rounded-md` 6 · `rounded-lg` 8 (kartu) · `rounded-xl` 12 (hero)
- Font: Plus Jakarta Sans (semua teks), IBM Plex Mono (log solver & nama kolom data).

> **Penting: `cn()`.** `src/lib/utils.ts` membuat `cn` lewat `createCn` yang mengenal skala tipografi custom (`text-body-strong`, `text-label`, dll.). Tanpa konfigurasi ini, `cn("text-body-strong", "text-brand")` akan membuang salah satu kelas karena keduanya dianggap utility warna. CLI shadcn versi terbaru menulis `import { cn } from "cn"` di komponen baru, jadi **setiap selesai `bunx shadcn add`, ganti import itu menjadi `@/lib/utils`**:
>
> ```bash
> grep -rlE 'from "cn"' src | xargs sed -i 's#from "cn"#from "@/lib/utils"#'
> ```

Aturan desain MVP (dari Figma Foundations): panel putih tanpa border/bayangan; kontrol cukup pakai garis tepi; status & sumber data ditampilkan sebagai ikon + teks berwarna (tanpa pill); satuan wajib ditulis.

Catatan: halaman Foundations di Figma masih v0.2 dan beberapa hex-nya berbeda dari variable di screen. Nilai dari screen dipakai sebagai acuan. `status/danger`, `energy/unserved`, dan `energy/battery-charge` diambil dari Foundations karena tidak muncul di screen.

## Git hooks (Lefthook)

Semua berjalan di hook `commit-msg`:

```
┌─ prettier (biome format, mode check) ─┐
│                                       ├─▶ lint (biome lint) ─▶ build
└─ commitlint ──────────────────────────┘
```

`prettier` dan `commitlint` berjalan paralel. Jika keduanya lolos, pipeline lanjut ke `lint` lalu `build`. Jika format gagal, jalankan `bun run format`, lalu `git add` ulang.

Format commit: [Conventional Commits](https://www.conventionalcommits.org/) dengan subject huruf kecil, contoh `feat: slicing halaman input simulasi`. Type yang diizinkan: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`, `build`, `revert`.

## Kontrak API (usulan FE)

Lihat `src/repository/simulation/dto.ts`.

```
GET  /load-profiles/presets
POST /simulations                (multipart bila ada file profil beban)
GET  /simulations/:id/progress   (di-poll tiap 1 detik)
POST /simulations/:id/cancel
GET  /simulations/:id/result     (409 NOT_READY bila solver belum selesai;
                                  hybrid infeasible -> baseline + failed_scenario)
GET  /simulations/:id/input      (input run, untuk mengisi ulang form via /simulasi?dari=<id>)
```

Respons dibungkus `{ payload: ... }`. Selama `NEXT_PUBLIC_BASE_API_URL` kosong, semua call dijawab oleh `src/repository/simulation/mock.ts`. State run disimpan di `sessionStorage` sehingga halaman proses tetap jalan setelah refresh. Data preset **El Espino** di mock masih **placeholder**, bukan data asli Balderrama dkk. (2019). Angka biaya (NPC, LCOE, OPEX, CAPEX) di hasil mock mengikuti mockup Figma (benchmark Subekti dkk. 2024), bukan output model. Kapasitas, biaya investasi komponen, konsumsi solar, dan dispatch dihitung dari input.
