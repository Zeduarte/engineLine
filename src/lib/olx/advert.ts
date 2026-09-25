import { canonicalBrand } from "@/lib/brand-name";
import { mapAttributes, type CarFacts, type OlxAttribute, type OlxAttributeDef } from "@/lib/olx/attributes";
import { buildDescription, buildTitle, textProblems } from "@/lib/olx/text";

/**
 * Anúncio do OLX a partir de uma viatura do site. Função pura.
 *
 * Devolve o corpo pronto a enviar a `POST /adverts` (ou `PUT`), ou a lista de
 * razões por que não pode ser publicado. Tudo o que o OLX valida e que se pode
 * saber antes de enviar é verificado aqui, para o erro chegar em português e
 * a dizer o que corrigir.
 */

export interface AdvertCar extends CarFacts {
  id: string;
  variant: string | null;
  price: number | null;
  priceOnRequest: boolean;
  description: string | null;
  tagline: string | null;
  extras: string[];
}

export interface AdvertContext {
  categoryId: number;
  attributeDefs: OlxAttributeDef[];
  cityId: number;
  latitude?: number;
  longitude?: number;
  contactName: string;
  contactPhone: string;
  /** URLs públicos das fotografias, pela ordem de apresentação. */
  images: string[];
  /** Máximo de fotografias da categoria (`photos_limit`); 0 = desconhecido. */
  photosLimit: number;
  /** Página da viatura no site. */
  siteUrl?: string;
}

export interface OlxAdvert {
  title: string;
  description: string;
  category_id: number;
  advertiser_type: "business";
  external_id: string;
  external_url?: string;
  contact: { name: string; phone: string };
  location: { city_id: number; latitude?: number; longitude?: number };
  images: { url: string }[];
  price: { value: number; currency: "EUR"; negotiable: boolean; trade: boolean };
  attributes: OlxAttribute[];
}

export type AdvertResult =
  | { ok: true; advert: OlxAdvert }
  | { ok: false; problems: string[] };

const km = (n: number) => `${new Intl.NumberFormat("pt-PT").format(n)} km`;

export function buildAdvert(car: AdvertCar, ctx: AdvertContext): AdvertResult {
  const problems: string[] = [];

  if (car.priceOnRequest || !car.price || car.price <= 0)
    problems.push("o OLX exige um preço — a viatura está «sob consulta»");
  if (!car.year) problems.push("falta o ano da viatura");
  if (!ctx.images.length) problems.push("o OLX exige pelo menos uma fotografia");
  if (!ctx.contactPhone) problems.push("falta o telefone do stand em Definições");
  if (!ctx.cityId) problems.push("falta a localização do stand no OLX (carregue as categorias)");

  const marca = canonicalBrand(car.make);
  const nome = [marca, car.model, car.variant].filter(Boolean).join(" ");
  const title = buildTitle(`${nome} ${car.year}`, [
    car.fuel,
    car.mileage > 0 ? km(car.mileage) : "",
    car.transmission,
  ].filter(Boolean));

  const ficha = [
    `Marca e modelo: ${nome}`,
    `Ano: ${car.year}`,
    car.mileage > 0 ? `Quilómetros: ${km(car.mileage)}` : "",
    `Combustível: ${car.fuel}`,
    `Caixa: ${car.transmission}`,
    car.power > 0 ? `Potência: ${car.power} cv` : "",
    car.color ? `Cor: ${car.color}` : "",
    car.extras.length ? `Equipamento: ${car.extras.join(", ")}` : "",
  ];
  const description = buildDescription(
    [car.tagline, car.description].filter(Boolean).join("\n\n"),
    ficha,
  );
  problems.push(...textProblems(title, description));

  const { attributes, missing } = mapAttributes(ctx.attributeDefs, { ...car, make: marca });
  problems.push(...missing);

  if (problems.length) return { ok: false, problems };

  const limite = ctx.photosLimit > 0 ? ctx.photosLimit : ctx.images.length;
  return {
    ok: true,
    advert: {
      title,
      description,
      category_id: ctx.categoryId,
      advertiser_type: "business",
      // O id do site identifica o anúncio no OLX: é por ele que se procura
      // antes de criar, para uma nova tentativa nunca duplicar o anúncio.
      external_id: car.id,
      ...(ctx.siteUrl ? { external_url: ctx.siteUrl } : {}),
      contact: { name: ctx.contactName, phone: ctx.contactPhone },
      location: {
        city_id: ctx.cityId,
        ...(ctx.latitude != null && ctx.longitude != null
          ? { latitude: ctx.latitude, longitude: ctx.longitude }
          : {}),
      },
      images: ctx.images.slice(0, limite).map((url) => ({ url })),
      price: { value: car.price!, currency: "EUR", negotiable: false, trade: false },
      attributes,
    },
  };
}
