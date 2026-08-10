/**
 * Modelo de domínio de uma viatura.
 *
 * Este ficheiro é a "fonte da verdade" de tipos do domínio público. O mapper
 * `src/lib/mappers.ts` converte as linhas do Supabase (`cars` + `car_media`)
 * neste tipo, de forma a que os componentes não conheçam o formato da BD.
 */

export type FuelType =
  | "Gasolina"
  | "Diesel"
  | "Híbrido"
  | "Híbrido Plug-in"
  | "Elétrico"
  | "GPL";

export type Transmission = "Manual" | "Automática";

export type BodyType =
  | "Berlina"
  | "SUV"
  | "Coupé"
  | "Carrinha"
  | "Citadino"
  | "Descapotável"
  | "Monovolume";

export type VehicleStatus = "draft" | "published" | "reserved" | "sold";

export interface VehicleVideo {
  src: string;
  /** mp4 | webm — usado no `type` do <source>. */
  type: string;
}

export interface VehicleImage {
  /** URL absoluta ou caminho em /public. */
  src: string;
  /** Alt text obrigatório para acessibilidade. */
  alt: string;
  /** Dimensões conhecidas para evitar layout shift (CLS). */
  width: number;
  height: number;
}

export interface VehicleSpec {
  label: string;
  value: string;
}

export interface Vehicle {
  /** UUID na base de dados (ausente em dados de mock). */
  id?: string;
  /** Identificador estável, usado como chave e em URLs de detalhe. */
  slug: string;
  make: string;
  model: string;
  /** Nível de acabamento / versão, ex. "Competition", "S line". */
  variant?: string;
  year: number;
  /** Preço em euros (inteiro, sem casas decimais). */
  price: number;
  mileage: number;
  fuel: FuelType;
  transmission: Transmission;
  body: BodyType;
  /** Potência em cavalos (cv). */
  power: number;
  /** Cilindrada em cm³ (0 para elétricos). */
  displacement: number;
  color: string;
  doors: number;
  seats: number;
  /** Destaque na homepage. */
  featured: boolean;
  /** Estado comercial. As páginas públicas só recebem `published`. */
  status?: VehicleStatus;
  /** `true` quando o preço é "sob consulta" (então `price` é 0). */
  priceOnRequest?: boolean;
  /** Equipamento / extras. */
  extras?: string[];
  /** Stand / localização. */
  location?: string;
  /** Frase curta de marketing. */
  tagline: string;
  description: string;
  /** Primeira imagem = capa; restantes = galeria. */
  images: VehicleImage[];
  /** Vídeo opcional do anúncio (mp4/webm). */
  video?: VehicleVideo | null;
  /** Ficha técnica alargada apresentada na secção pinned e no detalhe. */
  highlights: VehicleSpec[];
  /** ISO da última atualização (para sitemap / ordenação). */
  updatedAt?: string;
  /** ISO da criação (usado para o badge "Novidade"). */
  createdAt?: string;
}

/** Payload dos filtros do inventário. */
export interface VehicleFilters {
  make: string | null;
  model: string | null;
  fuel: FuelType | null;
  transmission: Transmission | null;
  minPrice: number | null;
  maxPrice: number | null;
  minYear: number | null;
  maxMileage: number | null;
}

export type SortKey =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "year-desc"
  | "mileage-asc";
