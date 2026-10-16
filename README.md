# DesaNyala FE

Frontend DesaNyala: simulasi dan optimasi sistem energi desa, membandingkan skenario **diesel-only**, **PV + diesel**, dan **PV + diesel + baterai** pada beban yang sama.

Desain: [Figma DESANYALA](https://www.figma.com/design/fSuDUVYlm7vOzb3jd3AdWP/DESANYALA?node-id=38-748)

## Scope saat ini

| Halaman | Route | Frame Figma | Status |
| --- | --- | --- | --- |
| Input simulasi (7 card, kontrak `desanyala.input.v1`) | `/simulasi` | 01, 01b + `desanyala_input_cards.html` | Selesai |
| Proses solver (berjalan, selesai, gagal) | `/simulasi/proses?id=` | 03, 03b | Selesai |
| Hasil optimasi (KPI, operasi energi, perbandingan, kapasitas, validasi, ekspor) | `/simulasi/hasil?id=&skenario=` | 02 + `desanyala_output_dashboard.html` | Selesai |
| Hasil infeasible/error (diagnosis per skenario) | `/simulasi/hasil?id=&skenario=` | 04 | Selesai |

`/` sementara di-redirect ke `/simulasi` karena halaman Beranda belum di-slice.

### Mencoba alur demo (mock API)

1. Buka `/simulasi`, isi **Nama proyek** dan **Lokasi administratif** (wajib), pilih **satu skenario** (Diesel-only, PV + diesel, atau PV + diesel + baterai) di card 7, lalu klik **Jalankan optimasi**. Skenario selesai dalam beberapa detik, lalu halaman pindah otomatis ke Hasil.
2. **Skenario gagal:** pilih skenario *Diesel-only*, ubah *Jumlah unit genset* menjadi `1` dan *Kapasitas per unit* menjadi `1` (1 kW < daya terpasang 2,65 kW) lalu jalankan. Diesel-only akan *infeasible*; halaman hasil menampilkan diagnosis, pesan solver, dan tombol **Ubah di input** yang membuka form terisi nilai run tersebut (`/simulasi?dari=<id>&fokus=<field>`). Cara lain: `NEXT_PUBLIC_MOCK_SOLVER_RESULT=fail` / `fail-partial` / `error`.
3. Tombol **Batalkan** menghentikan request yang sedang berjalan.

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
| `NEXT_PUBLIC_BASE_API_URL` | Base URL backend, mis. `https://desa-nyala-backend.vercel.app`. Kosong = mock API otomatis aktif. |
| `NEXT_PUBLIC_API_MODE` | `auto` (default): coba backend, bila backend error (engine error, 5xx, jaringan, timeout) run itu otomatis dihitung mock FE tanpa pemberitahuan di UI (tampilan proses & hasil sama dengan run backend). `backend`: selalu backend, error ditampilkan. `mock`: selalu mock FE. Error input (422 per field) tidak pernah di-fallback. |
| `NEXT_PUBLIC_MOCK_SOLVER_RESULT` | `auto` / `success` / `fail` / `fail-partial` / `error`. `auto` membuat diesel-only *infeasible* bila genset eksisting (unit × kW) < total daya terpasang peralatan dan kekurangan listrik tidak diizinkan. |
| `NEXT_PUBLIC_OPTIMIZATION_TIMEOUT_MS` | Batas waktu `POST /api/v1/optimizations` (default 900000 = 15 menit). |

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

## Integrasi backend

Backend: [dindawijayanto/desa-nyala-backend](https://github.com/dindawijayanto/desa-nyala-backend) (FastAPI + adapter Offgridders). Tipe ada di `src/repository/simulation/dto.ts`.

```
GET  /health                     status API + engine
POST /api/v1/inputs/validate     validasi kontrak + estimasi energi (dipanggil sebelum optimasi)
POST /api/v1/optimizations       jalankan semua skenario, sinkron -> OptimizationResponse
```

- **Request** = kontrak **`desanyala.input.v1`** (`desanyala_input_cards.html` / `desanyala_variable_names.txt`, sama dengan `buildConfig()`). Nama field form = JSON path (mis. `pv.capex_per_kwp`), atribut `id` input = HTML ID referensi (mis. `pvCapex`). Persentase diisi 0..100 di UI dan dikirim sebagai pecahan 0..1 oleh `src/feature/input-simulasi/util/to-simulation-request.ts`.
- **Response** = `OptimizationResponse` (`desanyala_output_variable_names.txt`): `scenario_results[]` berisi `metrics`, `capacities`, `validation`, dan `dispatch[]` per jam.
- **Validasi** di `src/schemas/simulation/simulation.schema.ts` mengikuti Pydantic backend (`app/schemas/input.py`) plus penolakan adapter: eskalasi harga diesel harus 0, `fuel_model=curve` dan objektif `fuel_consumption` belum didukung, skenario PV + diesel + baterai butuh baterai aktif, `max_unmet ≤ 1 − target`. Error 422 dari backend dipetakan ke field form terkait.
- **Run lokal** (`src/repository/simulation/run-store.ts`): backend tidak punya endpoint progres/batal/hasil per id, jadi FE membuat id run sendiri, menjalankan request di latar belakang, menurunkan progres dari waktu berjalan, dan menyimpan input + respons di `sessionStorage` (dispatch disimpan per kolom). Refresh saat solver berjalan menandai run *terputus*.
- Mock FE (`src/repository/simulation/mock.ts`) menghasilkan respons berbentuk sama dari heuristik sederhana (bukan Offgridders). Dipakai di mode `mock`, atau sebagai fallback di mode `auto` saat backend error; sumber setiap run (`source`: `backend` / `mock` / `mock_fallback`) dan alasan fallback (`fallback`) hanya disimpan di `sessionStorage` (kunci `desanyala:simulation-run:<id>`) untuk debugging, tidak ditampilkan di UI.
- CORS backend saat ini hanya mengizinkan `http://localhost:3000` (lihat `DESANYALA_CORS_ORIGINS` di backend); domain deploy FE perlu ditambahkan di sana.
