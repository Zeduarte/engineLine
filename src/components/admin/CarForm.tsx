"use client";

import {
  CAR_BODIES,
  MOTORCYCLE_BODIES,
  MOTORCYCLE_BRANDS,
  type VehicleType,
} from "@/lib/vehicle-categories";
import type { PointOfSale } from "@/lib/showroom";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  carFormSchema,
  type CarFormValues,
  FUEL_TYPES,
  TRANSMISSIONS,
  CAR_STATUSES,
  CHANNELS,
} from "@/lib/schemas";
import { CAR_STATUS_LABEL } from "./StatusBadge";
import { createCar, updateCar } from "@/lib/actions/cars";
import { Combobox } from "@/components/ui/Combobox";
import {
  CAR_BRANDS,
  CAR_COLORS,
  COMMON_EXTRAS,
  yearOptions,
} from "@/lib/car-brands";
import { CAR_MODELS } from "@/lib/car-models";
import { extrasCatalog, MOTORCYCLE_EXTRAS_CATALOG } from "@/lib/extras";

// Lista de anos calculada uma vez (o ano corrente é estável na sessão).
const YEARS = yearOptions();

// Opções fixas para portas e lugares. Uma mota leva o condutor e, no máximo,
// um passageiro — oferecer 4 a 9 lugares só convidava ao erro.
const DOOR_OPTIONS = [0, 2, 3, 4, 5];
const CAR_SEAT_OPTIONS = [1, 2, 4, 5, 6, 7, 8, 9];
const MOTORCYCLE_SEAT_OPTIONS = [1, 2];

/**
 * Formata a matrícula em grupos de 2 separados por hífen (ex.: "44vs23" →
 * "44-VS-23"). Aceita letras e dígitos, em maiúsculas.
 */
function formatPlate(raw: string): string {
  const clean = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  return clean.match(/.{1,2}/g)?.join("-") ?? "";
}

// Ao focar um campo numérico, seleciona o conteúdo — assim escrever substitui
// logo o "0" em vez de obrigar a apagá-lo primeiro.
const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) =>
  e.currentTarget.select();

export function CarForm({
  carId,
  defaults,
  locations = [],
}: {
  locations?: PointOfSale[];
  carId?: string;
  defaults?: Partial<CarFormValues>;
}) {
  const router = useRouter();
  const [typeChosen, setTypeChosen] = useState(Boolean(carId || defaults?.vehicle_type));
  const [extras, setExtras] = useState<string[]>(defaults?.extras ?? []);
  const [extraInput, setExtraInput] = useState("");
  const [channels, setChannels] = useState<string[]>(defaults?.channels ?? []);

  function toggleChannel(id: string) {
    setChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      vehicle_type: "car",
      registration_month: null,
      point_of_sale_id: "",
      make: "",
      model: "",
      variant: "",
      year: new Date().getFullYear(),
      license_plate: "",
      mileage: 0,
      fuel: "Gasolina",
      transmission: "Manual",
      body: "Berlina",
      // Vazios de propósito: um zero pré-preenchido lia-se como "0 cv" no
      // anúncio quando o vendedor não indicava a potência.
      power: undefined,
      displacement: undefined,
      color: "",
      doors: 5,
      seats: 5,
      price_on_request: false,
      price: undefined,
      status: "draft",
      featured: false,
      tagline: "",
      description: "",
      extras: [],
      location: "",
      previous_price: undefined,
      national: false,
      owners: undefined,
      first_owner: false,
      service_book: false,
      warranty_months: undefined,
      last_inspection: "",
      channels: [],
      ...defaults,
    },
  });

  const vehicleType = watch("vehicle_type");
  const onRequest = watch("price_on_request");
  const make = watch("make") ?? "";
  const modelOptions =
    vehicleType === "motorcycle" ? [] : (CAR_MODELS[make] ?? []);

  function chooseType(kind: VehicleType) {
    if (kind !== vehicleType) {
      setValue("vehicle_type", kind, { shouldDirty: true });
      setValue("body", kind === "motorcycle" ? "Naked" : "Berlina", {
        shouldDirty: true,
      });
      setValue("doors", kind === "motorcycle" ? 0 : 5, { shouldDirty: true });
      setValue("seats", kind === "motorcycle" ? 2 : 5, { shouldDirty: true });
      setValue("make", "", { shouldDirty: true });
      setValue("model", "", { shouldDirty: true });
      setValue("variant", "", { shouldDirty: true });
      // O equipamento já marcado era do outro tipo de viatura: um carro não
      // leva quickshifter nem uma mota vidros elétricos.
      setExtras([]);
      setValue("extras", [], { shouldDirty: true });
    }
    setTypeChosen(true);
  }
  // Sugestões de extras que ainda não foram adicionadas, do tipo certo.
  const extraPool =
    vehicleType === "motorcycle"
      ? MOTORCYCLE_EXTRAS_CATALOG.flatMap((g) => g.items)
      : COMMON_EXTRAS;
  const extraSuggestions = extraPool.filter((e) => !extras.includes(e));

  function addExtraValue(raw: string) {
    const v = raw.trim();
    if (!v) return;
    const next = [...new Set([...extras, v])];
    setExtras(next);
    setValue("extras", next);
    setExtraInput("");
  }
  function addExtra() {
    addExtraValue(extraInput);
  }
  function removeExtra(v: string) {
    const next = extras.filter((e) => e !== v);
    setExtras(next);
    setValue("extras", next);
  }
  /** Liga/desliga um extra do catálogo (checkbox). */
  function toggleExtra(v: string) {
    const next = extras.includes(v)
      ? extras.filter((e) => e !== v)
      : [...new Set([...extras, v])];
    setExtras(next);
    setValue("extras", next);
  }

  async function onSubmit(values: CarFormValues) {
    const payload = { ...values, extras, channels };
    const res = carId
      ? await updateCar(carId, payload)
      : await createCar(payload);

    if (!res.ok) {
      toast.error(res.error ?? "Não foi possível guardar.");
      return;
    }
    if (values.vehicle_type !== defaults?.vehicle_type) {
      window.location.assign(`/api/vehicle-context?area=admin&type=${values.vehicle_type}&target=${encodeURIComponent(`/admin/carros/${carId ?? res.id}`)}`);
      return;
    }
    if (carId) {
      toast.success("Alterações guardadas.");
      router.refresh();
    } else {
      toast.success("Viatura criada. Adicione agora as fotografias.");
      router.push(`/admin/carros/${res.id}`);
    }
  }

  const typeSelector = (
    <section className="card p-5" aria-labelledby="vehicle-type-heading">
      <h2
        id="vehicle-type-heading"
        className="text-lg font-semibold text-paper"
      >
        {carId ? "Tipo de anúncio" : "O que pretende anunciar?"}
      </h2>
      {!typeChosen && (
        <p className="mt-2 text-sm text-paper/60">
          Escolha carro ou mota para começar a preencher o anúncio.
        </p>
      )}
      <div
        className="mt-4 grid grid-cols-2 gap-3"
        role="group"
        aria-label="Tipo de anúncio"
      >
        {(
          [
            { value: "car", label: "Carro" },
            { value: "motorcycle", label: "Mota" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isSubmitting}
            aria-pressed={typeChosen && vehicleType === option.value}
            onClick={() => chooseType(option.value)}
            className={`rounded-xl border px-5 py-5 text-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 ${typeChosen && vehicleType === option.value ? "border-accent bg-accent/10 text-accent" : "border-white/15 text-paper hover:border-accent"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {typeChosen && (
        <p className="mt-3 text-sm text-paper/60" role="status">
          Anúncio de {vehicleType === "motorcycle" ? "mota" : "carro"}
        </p>
      )}
    </section>
  );
  if (!typeChosen) return typeSelector;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {typeSelector}
      <input type="hidden" {...register("vehicle_type")} />
      {/* Identificação */}
      <Section title="Identificação">
        <Grid>
          <Field
            label="Mês da primeira matrícula"
            error={errors.registration_month?.message}
          >
            <select className="field" {...register("registration_month")}>
              <option value="">Não indicado</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Ponto de venda"
            error={errors.point_of_sale_id?.message}
          >
            <select
              className="field"
              {...register("point_of_sale_id")}
              onChange={(e) => {
                setValue("point_of_sale_id", e.target.value, {
                  shouldDirty: true,
                });
                const point = locations.find((l) => l.id === e.target.value);
                if (point)
                  setValue("location", point.name, { shouldDirty: true });
              }}
            >
              <option value="">Sem associação</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Marca" error={errors.make?.message} required>
            <Combobox
              value={make}
              onChange={(v) => {
                setValue("make", v, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                // Mudar de marca invalida o modelo anterior.
                if (v !== make) {
                  setValue("model", "", { shouldDirty: true });
                }
              }}
              options={
                vehicleType === "motorcycle" ? MOTORCYCLE_BRANDS : CAR_BRANDS
              }
              placeholder={
                vehicleType === "motorcycle"
                  ? "Ex.: Honda"
                  : "Ex.: Mercedes-Benz"
              }
            />
          </Field>
          <Field label="Modelo" error={errors.model?.message} required>
            <Combobox
              value={watch("model") ?? ""}
              onChange={(v) =>
                setValue("model", v, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              options={modelOptions}
              disabled={!make}
              placeholder={
                !make
                  ? "Escolha a marca primeiro"
                  : modelOptions.length
                    ? "Ex.: Classe C"
                    : "Escreva o modelo"
              }
            />
          </Field>
          <Field label="Versão" error={errors.variant?.message}>
            <input
              className="field"
              {...register("variant")}
              placeholder="Competition, AMG Line…"
            />
          </Field>
          <Field label="Ano" error={errors.year?.message} required>
            <Combobox
              value={String(watch("year") ?? "")}
              onChange={(v) =>
                setValue("year", v as unknown as number, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              options={YEARS}
              placeholder="Ex.: 2020"
            />
          </Field>
          <Field
            label="Matrícula (privado)"
            error={errors.license_plate?.message}
          >
            <input
              className="field uppercase"
              placeholder="AA-00-AA"
              {...register("license_plate")}
              onChange={(e) =>
                setValue("license_plate", formatPlate(e.target.value), {
                  shouldDirty: true,
                })
              }
            />
          </Field>
          <Field label="Cor" error={errors.color?.message}>
            <Combobox
              value={watch("color") ?? ""}
              onChange={(v) =>
                setValue("color", v, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              options={CAR_COLORS}
              placeholder="Ex.: Preto"
            />
          </Field>
        </Grid>
      </Section>

      {/* Mecânica */}
      <Section title="Mecânica">
        <Grid>
          <Field label="Quilómetros" error={errors.mileage?.message} required>
            <input
              type="number"
              className="field"
              onFocus={selectOnFocus}
              {...register("mileage")}
            />
          </Field>
          <Field label="Combustível" error={errors.fuel?.message} required>
            <select className="field" {...register("fuel")}>
              <option value="">Por confirmar — selecione</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Caixa" error={errors.transmission?.message} required>
            <select className="field" {...register("transmission")}>
              <option value="">Por confirmar — selecione</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={
              vehicleType === "motorcycle" ? "Categoria da mota" : "Carroçaria"
            }
            error={errors.body?.message}
            required
          >
            <select
              className="field"
              {...register("body")}
              value={watch("body") ?? ""}
            >
              <option value="">Por confirmar — selecione</option>
              {(vehicleType === "motorcycle"
                ? MOTORCYCLE_BODIES
                : CAR_BODIES
              ).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Potência (cv)" error={errors.power?.message}>
            <input
              type="number"
              className="field"
              onFocus={selectOnFocus}
              {...register("power")}
            />
          </Field>
          <Field label="Cilindrada (cm³)" error={errors.displacement?.message}>
            <input
              type="number"
              className="field"
              onFocus={selectOnFocus}
              {...register("displacement")}
            />
          </Field>
          {vehicleType === "motorcycle" ? (
            <input type="hidden" {...register("doors")} />
          ) : (
            <Field label="Portas" error={errors.doors?.message}>
              <select className="field" {...register("doors")}>
                {DOOR_OPTIONS.filter((n) => n > 0).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Lugares" error={errors.seats?.message}>
            <select className="field" {...register("seats")}>
              {(vehicleType === "motorcycle"
                ? MOTORCYCLE_SEAT_OPTIONS
                : CAR_SEAT_OPTIONS
              ).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        </Grid>
      </Section>

      {/* Comercial */}
      <Section title="Comercial">
        <Grid>
          <Field label="Preço (€)" error={errors.price?.message}>
            <input
              type="number"
              className="field disabled:opacity-40"
              disabled={onRequest}
              onFocus={selectOnFocus}
              {...register("price")}
            />
          </Field>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input
                type="checkbox"
                className="accent-[color:var(--accent)]"
                {...register("price_on_request")}
              />
              Preço sob consulta
            </label>
          </div>
          <Field label="Estado" error={errors.status?.message}>
            <select className="field" {...register("status")}>
              {CAR_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CAR_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input
                type="checkbox"
                className="accent-[color:var(--accent)]"
                {...register("featured")}
              />
              Destaque na homepage
            </label>
          </div>
          <Field label="Localização / stand" error={errors.location?.message}>
            <input className="field" {...register("location")} />
          </Field>
        </Grid>
      </Section>

      {/* Transparência & badges */}
      <Section title="Transparência & destaques">
        <Grid>
          <Field label="Preço anterior (€) — mostra «Baixa de preço»">
            <input
              type="number"
              className="field"
              onFocus={selectOnFocus}
              {...register("previous_price")}
            />
          </Field>
          <Field label="Nº de donos">
            <input
              type="number"
              className="field"
              onFocus={selectOnFocus}
              {...register("owners")}
            />
          </Field>
          <Field label="Garantia (meses)">
            <input
              type="number"
              className="field"
              onFocus={selectOnFocus}
              {...register("warranty_months")}
            />
          </Field>
          <Field label="Última inspeção">
            <input
              type="date"
              className="field"
              {...register("last_inspection")}
            />
          </Field>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input
                type="checkbox"
                className="accent-[color:var(--accent)]"
                {...register("national")}
              />
              Viatura nacional (badge «Nacional»)
            </label>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input
                type="checkbox"
                className="accent-[color:var(--accent)]"
                {...register("first_owner")}
              />
              Primeiro dono
            </label>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input
                type="checkbox"
                className="accent-[color:var(--accent)]"
                {...register("service_book")}
              />
              Livro de revisões completo
            </label>
          </div>
        </Grid>
      </Section>

      {/* Conteúdo */}
      <Section title="Conteúdo">
        <div className="space-y-4">
          <Field label="Slogan (frase curta)" error={errors.tagline?.message}>
            <input
              className="field"
              {...register("tagline")}
              placeholder="Precisão alemã, sem compromissos."
            />
          </Field>
          <Field label="Descrição" error={errors.description?.message}>
            <textarea rows={6} className="field" {...register("description")} />
          </Field>

          <div>
            <span className="field-label">Extras / equipamento</span>

            {/* Catálogo por categoria — marcar os que a viatura tem. Aparecem
                no site agrupados exatamente por estas categorias. */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              {extrasCatalog(vehicleType === "motorcycle" ? "motorcycle" : "car").map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-paper/50">
                    {group.title}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <label
                        key={item}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-paper/80 transition-colors hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={extras.includes(item)}
                          onChange={() => toggleExtra(item)}
                          className="h-4 w-4 shrink-0 accent-accent"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Extra personalizado (texto livre) para o que não está na lista. */}
            <p className="mb-1.5 mt-4 text-xs text-paper/50">
              Adicionar outro equipamento (opcional)
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Combobox
                  value={extraInput}
                  onChange={setExtraInput}
                  onSelect={addExtraValue}
                  options={extraSuggestions}
                  placeholder="Escreva ou escolha. Enter para adicionar"
                />
              </div>
              <button
                type="button"
                onClick={addExtra}
                className="btn-ghost h-auto px-4"
              >
                Adicionar
              </button>
            </div>
            {extras.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {extras.map((e) => (
                  <li
                    key={e}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-paper"
                  >
                    {e}
                    <button
                      type="button"
                      onClick={() => removeExtra(e)}
                      aria-label={`Remover ${e}`}
                      className="text-paper/50 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      {/* Exportação multi-canal */}
      <Section title="Publicar noutras plataformas">
        <p className="mb-4 text-xs text-paper/50">
          Selecione os portais onde quer anunciar esta viatura. As viaturas
          escolhidas ficam disponíveis no feed de exportação de cada plataforma
          (ver Definições → Integrações).
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNELS.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-paper/80 transition-colors hover:border-white/20"
            >
              <input
                type="checkbox"
                className="accent-[color:var(--accent)]"
                checked={channels.includes(c.id)}
                onChange={() => toggleChannel(c.id)}
              />
              {c.label}
            </label>
          ))}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-2 flex items-center justify-end gap-3 border-t border-white/10 bg-ink/90 px-2 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => router.push("/admin/carros")}
          className="btn-ghost"
        >
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting
            ? "A guardar…"
            : carId
              ? "Guardar alterações"
              : "Criar viatura"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-paper/50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

function Field({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="field-label">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {children}
      {error ? (
        <p className="field-error">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-paper/40">{hint}</p>
      ) : null}
    </div>
  );
}
