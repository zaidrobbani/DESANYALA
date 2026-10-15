import { IconMapPin } from "@tabler/icons-react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import type { SimulationFormValues } from "@/schemas/simulation/simulation.schema";
import SectionCard from "@/shared/component/SectionCard";
import SelectField from "@/shared/component/SelectField";
import TextField from "@/shared/component/TextField";
import { PROVINCE_OPTIONS, SIMULATION_STEPS, TIMEZONE_OPTIONS } from "../data";

const STEP = SIMULATION_STEPS[0];
const MAP_DELTA = 0.05;

interface MapPreviewProps {
  coordinates: { lat: number; lng: number } | null;
}

const MapPreview = ({ coordinates }: MapPreviewProps) => {
  if (!coordinates) {
    return (
      <div className="flex h-[150px] flex-1 flex-col items-center justify-center gap-1.5 rounded-lg bg-subtle px-4 text-center">
        <IconMapPin
          aria-hidden
          className="size-[22px] text-fg-tertiary"
          stroke={1.75}
        />
        <p className="text-body-strong text-fg-secondary">
          Pratinjau peta (OpenStreetMap)
        </p>
        <p className="text-fg-tertiary text-small">
          Muncul setelah koordinat diisi
        </p>
      </div>
    );
  }

  const { lat, lng } = coordinates;
  const bbox = [
    lng - MAP_DELTA,
    lat - MAP_DELTA,
    lng + MAP_DELTA,
    lat + MAP_DELTA,
  ]
    .map((value) => value.toFixed(5))
    .join(",");

  return (
    <div className="h-[150px] flex-1 overflow-hidden rounded-lg bg-subtle">
      <iframe
        title="Pratinjau lokasi desa di OpenStreetMap"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
        className="size-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

interface LokasiSectionProps {
  control: Control<SimulationFormValues>;
  register: UseFormRegister<SimulationFormValues>;
  errors: FieldErrors<SimulationFormValues>["lokasi"];
  coordinates: { lat: number; lng: number } | null;
  onProvinceChange: (province: string) => void;
}

const LokasiSection = ({
  control,
  register,
  errors,
  coordinates,
  onProvinceChange,
}: LokasiSectionProps) => {
  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <TextField
          label="Nama desa / lokasi"
          placeholder="Mis. Kampung Yensawai"
          error={errors?.nama_desa?.message}
          {...register("lokasi.nama_desa")}
        />
        <Controller
          control={control}
          name="lokasi.provinsi"
          render={({ field }) => (
            <SelectField
              id="lokasi-provinsi"
              label="Provinsi"
              value={field.value}
              options={PROVINCE_OPTIONS}
              onValueChange={onProvinceChange}
              placeholder="Pilih provinsi"
              error={errors?.provinsi?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="lokasi.zona_waktu"
          render={({ field }) => (
            <SelectField
              id="lokasi-zona-waktu"
              label="Zona waktu"
              value={field.value}
              options={TIMEZONE_OPTIONS}
              onValueChange={field.onChange}
              error={errors?.zona_waktu?.message}
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <MapPreview coordinates={coordinates} />
        <fieldset className="flex min-w-0 flex-1 flex-col gap-2.5">
          <legend className="mb-2.5 text-body-strong">
            Koordinat (opsional)
          </legend>
          <div className="flex flex-col gap-3 sm:flex-row">
            <TextField
              label="Latitude"
              placeholder="Belum diisi"
              inputMode="decimal"
              autoComplete="off"
              error={errors?.latitude?.message}
              {...register("lokasi.latitude")}
            />
            <TextField
              label="Longitude"
              placeholder="Belum diisi"
              inputMode="decimal"
              autoComplete="off"
              error={errors?.longitude?.message}
              {...register("lokasi.longitude")}
            />
          </div>
          <p className="text-fg-tertiary text-small">
            Jika diisi, profil surya diambil dari NASA POWER. Jika kosong,
            dipakai radiasi rata-rata di bagian 3.
          </p>
        </fieldset>
      </div>
    </SectionCard>
  );
};

export default LokasiSection;
