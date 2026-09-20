"use client";
import { useState } from "react";
import { saveShowroom } from "@/lib/actions/showroom";
import {
  SERVICE_IDS,
  type ShowroomContent,
  type PointOfSale,
} from "@/lib/showroom";
export function ShowroomForm({
  initial,
  googleConfigured,
}: {
  initial: ShowroomContent;
  googleConfigured: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  function location(index: number, patch: Partial<PointOfSale>) {
    setValue((v) => ({
      ...v,
      locations: v.locations.map((l, i) =>
        i === index ? { ...l, ...patch } : l,
      ),
    }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const r = await saveShowroom(value);
      setMessage(
        r.ok
          ? "Conteúdos guardados."
          : (r.error ?? "Não foi possível guardar."),
      );
    } catch {
      setMessage("Não foi possível guardar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="mt-10 space-y-8">
      <h2 className="text-2xl font-semibold">
        Serviços, confiança e pontos de venda
      </h2>
      <fieldset disabled={pending} className="space-y-8 disabled:opacity-60">
        <section className="card space-y-4 p-5">
          <h3 className="text-lg font-semibold">Pontos de venda</h3>
          <p className="text-sm text-paper/60">
            Crie as instalações reais do stand. Associe cada viatura ao seu
            ponto de venda no editor de viaturas. Se não adicionar pontos,
            mantém-se a morada das Definições.
          </p>
          {value.locations.map((l, i) => (
            <fieldset
              key={i}
              className="space-y-3 rounded-xl border border-white/10 p-4"
            >
              <legend>{l.name || `Ponto ${i + 1}`}</legend>
              {/* O identificador liga a viatura ao ponto e é gerado pelo
                  sistema — mostra-se só para referência, não se edita. */}
              <p className="text-xs text-paper/40">Referência: {l.id}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["name", "Nome"],
                    ["address", "Morada"],
                    ["city", "Localidade"],
                    ["postalCode", "Código postal"],
                    ["phone", "Telefone"],
                    ["email", "Email"],
                    ["hours", "Horários"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-sm">
                    {label}
                    <input
                      className="field mt-1"
                      value={l[key]}
                      onChange={(e) => location(i, { [key]: e.target.value })}
                      required={["name", "address", "city"].includes(key)}
                      type={key === "email" ? "email" : "text"}
                    />
                  </label>
                ))}
                {(
                  [
                    ["latitude", "Latitude"],
                    ["longitude", "Longitude"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-sm">
                    {label}
                    <input
                      className="field mt-1"
                      type="number"
                      step="any"
                      min={key === "latitude" ? -90 : -180}
                      max={key === "latitude" ? 90 : 180}
                      value={l[key] ?? ""}
                      onChange={(e) =>
                        location(i, {
                          [key]:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  setValue((v) => ({
                    ...v,
                    locations: v.locations.filter((_, j) => j !== i),
                  }))
                }
              >
                Remover ponto
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() =>
              setValue((v) => ({
                ...v,
                locations: [
                  ...v.locations,
                  {
                    id: `ponto-${crypto.randomUUID().slice(0, 8)}`,
                    name: "",
                    address: "",
                    city: "",
                    postalCode: "",
                    phone: "",
                    email: "",
                    hours: "",
                    latitude: null,
                    longitude: null,
                  },
                ],
              }))
            }
          >
            Adicionar ponto de venda
          </button>
        </section>
        <section className="card space-y-5 p-5">
          <h3 className="text-lg font-semibold">Páginas de serviços</h3>
          <p className="text-sm text-paper/60">
            Publique apenas os serviços que presta. Substitua os textos por
            condições reais; no financiamento, inclua a identificação do
            intermediário e as informações aplicáveis à sua atividade.
          </p>
          {value.services.map((s, i) => (
            <fieldset
              key={s.id}
              className="space-y-3 border-t border-white/10 pt-4"
            >
              <legend className="font-semibold">{s.title}</legend>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      services: v.services.map((x, j) =>
                        j === i ? { ...x, enabled: e.target.checked } : x,
                      ),
                    }))
                  }
                />
                Publicar página
              </label>
              {(["title", "summary", "body"] as const).map((k) => (
                <label key={k} className="block text-sm">
                  {
                    {
                      title: "Título",
                      summary: "Resumo",
                      body: "Conteúdo (separe parágrafos com uma linha vazia)",
                    }[k]
                  }
                  <textarea
                    className="field mt-1"
                    required
                    rows={k === "body" ? 6 : 2}
                    value={s[k]}
                    onChange={(e) =>
                      setValue((v) => ({
                        ...v,
                        services: v.services.map((x, j) =>
                          j === i ? { ...x, [k]: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </label>
              ))}
            </fieldset>
          ))}
        </section>
        <section className="card space-y-4 p-5">
          <h3 className="text-lg font-semibold">Perguntas frequentes</h3>
          {value.faqs.map((f, i) => (
            <fieldset
              key={i}
              className="grid gap-3 border-t border-white/10 pt-4"
            >
              <legend>Pergunta {i + 1}</legend>
              <label className="text-sm">
                Página
                <select
                  className="field mt-1"
                  value={f.category}
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      faqs: v.faqs.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              category: e.target.value as typeof f.category,
                            }
                          : x,
                      ),
                    }))
                  }
                >
                  {["geral", ...SERVICE_IDS].map((id) => (
                    <option key={id} value={id}>
                      {id === "geral" ? "Página inicial" : id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Pergunta
                <input
                  required
                  className="field mt-1"
                  value={f.question}
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      faqs: v.faqs.map((x, j) =>
                        j === i ? { ...x, question: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </label>
              <label className="text-sm">
                Resposta
                <textarea
                  required
                  className="field mt-1"
                  rows={3}
                  value={f.answer}
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      faqs: v.faqs.map((x, j) =>
                        j === i ? { ...x, answer: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="btn-ghost justify-self-start"
                onClick={() =>
                  setValue((v) => ({
                    ...v,
                    faqs: v.faqs.filter((_, j) => j !== i),
                  }))
                }
              >
                Remover pergunta
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() =>
              setValue((v) => ({
                ...v,
                faqs: [
                  ...v.faqs,
                  { category: "geral", question: "", answer: "" },
                ],
              }))
            }
          >
            Adicionar pergunta
          </button>
        </section>
        <section className="card space-y-4 p-5">
          <h3 className="text-lg font-semibold">Avaliações Google</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.google.enabled}
              onChange={(e) =>
                setValue((v) => ({
                  ...v,
                  google: { ...v.google, enabled: e.target.checked },
                }))
              }
            />
            Mostrar avaliações Google
          </label>
          <label className="block text-sm">
            Ligação do perfil no Google Maps
            <input
              type="url"
              className="field mt-1"
              value={value.google.mapsUrl}
              onChange={(e) =>
                setValue((v) => ({
                  ...v,
                  google: { ...v.google, mapsUrl: e.target.value },
                }))
              }
            />
          </label>
          <label className="block text-sm">
            Google Place ID
            <input
              className="field mt-1"
              value={value.google.placeId}
              onChange={(e) =>
                setValue((v) => ({
                  ...v,
                  google: { ...v.google, placeId: e.target.value },
                }))
              }
            />
          </label>
          <p className="text-sm text-paper/60">
            {googleConfigured
              ? "Chave Places configurada no servidor."
              : "Para carregar a classificação e as avaliações, configure GOOGLE_PLACES_API_KEY no alojamento e ative Places API (New). Sem chave, mostramos apenas a ligação ao perfil."}{" "}
            Os pedidos à API podem ter custos no Google Cloud. Nunca introduza a
            chave neste formulário.
          </p>
        </section>
      </fieldset>
      <p role="status" className="text-sm text-accent">
        {message}
      </p>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "A guardar…" : "Guardar serviços e pontos de venda"}
      </button>
    </form>
  );
}
