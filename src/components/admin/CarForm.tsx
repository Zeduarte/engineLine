"use client";

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
  BODY_TYPES,
  CAR_STATUSES,
} from "@/lib/schemas";
import { CAR_STATUS_LABEL } from "./StatusBadge";
import { createCar, updateCar } from "@/lib/actions/cars";

export function CarForm({
  carId,
  defaults,
}: {
  carId?: string;
  defaults?: Partial<CarFormValues>;
}) {
  const router = useRouter();
  const [extras, setExtras] = useState<string[]>(defaults?.extras ?? []);
  const [extraInput, setExtraInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: "",
      model: "",
      variant: "",
      year: new Date().getFullYear(),
      license_plate: "",
      mileage: 0,
      fuel: "Gasolina",
      transmission: "Manual",
      body: "Berlina",
      power: 0,
      displacement: 0,
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
      ...defaults,
    },
  });

  const onRequest = watch("price_on_request");

  function addExtra() {
    const v = extraInput.trim();
    if (!v) return;
    const next = [...new Set([...extras, v])];
    setExtras(next);
    setValue("extras", next);
    setExtraInput("");
  }
  function removeExtra(v: string) {
    const next = extras.filter((e) => e !== v);
    setExtras(next);
    setValue("extras", next);
  }

  async function onSubmit(values: CarFormValues) {
    const payload = { ...values, extras };
    const res = carId
      ? await updateCar(carId, payload)
      : await createCar(payload);

    if (!res.ok) {
      toast.error(res.error ?? "Não foi possível guardar.");
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      {/* Identificação */}
      <Section title="Identificação">
        <Grid>
          <Field label="Marca" error={errors.make?.message} required>
            <input className="field" {...register("make")} />
          </Field>
          <Field label="Modelo" error={errors.model?.message} required>
            <input className="field" {...register("model")} />
          </Field>
          <Field label="Versão" error={errors.variant?.message}>
            <input className="field" {...register("variant")} placeholder="Competition, AMG Line…" />
          </Field>
          <Field label="Ano" error={errors.year?.message} required>
            <input type="number" className="field" {...register("year")} />
          </Field>
          <Field
            label="Matrícula (privado)"
            error={errors.license_plate?.message}
          >
            <input className="field" {...register("license_plate")} />
          </Field>
          <Field label="Cor" error={errors.color?.message}>
            <input className="field" {...register("color")} />
          </Field>
        </Grid>
      </Section>

      {/* Mecânica */}
      <Section title="Mecânica">
        <Grid>
          <Field label="Quilómetros" error={errors.mileage?.message} required>
            <input type="number" className="field" {...register("mileage")} />
          </Field>
          <Field label="Combustível" error={errors.fuel?.message} required>
            <select className="field" {...register("fuel")}>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Caixa" error={errors.transmission?.message} required>
            <select className="field" {...register("transmission")}>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Carroçaria" error={errors.body?.message} required>
            <select className="field" {...register("body")}>
              {BODY_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Potência (cv)" error={errors.power?.message}>
            <input type="number" className="field" {...register("power")} />
          </Field>
          <Field label="Cilindrada (cm³)" error={errors.displacement?.message}>
            <input
              type="number"
              className="field"
              {...register("displacement")}
            />
          </Field>
          <Field label="Portas" error={errors.doors?.message}>
            <input type="number" className="field" {...register("doors")} />
          </Field>
          <Field label="Lugares" error={errors.seats?.message}>
            <input type="number" className="field" {...register("seats")} />
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
            <input type="number" className="field" {...register("previous_price")} />
          </Field>
          <Field label="Nº de donos">
            <input type="number" className="field" {...register("owners")} />
          </Field>
          <Field label="Garantia (meses)">
            <input type="number" className="field" {...register("warranty_months")} />
          </Field>
          <Field label="Última inspeção">
            <input type="date" className="field" {...register("last_inspection")} />
          </Field>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input type="checkbox" className="accent-[color:var(--accent)]" {...register("national")} />
              Viatura nacional (badge «Nacional»)
            </label>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input type="checkbox" className="accent-[color:var(--accent)]" {...register("first_owner")} />
              Primeiro dono
            </label>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input type="checkbox" className="accent-[color:var(--accent)]" {...register("service_book")} />
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
            <div className="flex gap-2">
              <input
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addExtra();
                  }
                }}
                placeholder="Ex.: Teto de abrir. Enter para adicionar"
                className="field flex-1"
              />
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
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="field-label">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
