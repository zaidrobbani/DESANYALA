import type { Metadata } from "next";
import InputSimulasiContainer from "@/feature/input-simulasi/container/InputSimulasiContainer";

export const metadata: Metadata = {
  title: "Atur skenario energi desa",
};

export default function SimulasiPage() {
  return <InputSimulasiContainer />;
}
