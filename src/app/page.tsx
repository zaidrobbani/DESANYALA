import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/constant/routes";

// Halaman beranda belum di-slice; sementara arahkan ke simulasi.
export default function HomePage() {
  redirect(ROUTES.simulasi);
}
