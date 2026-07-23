/**
 * Modelo de domínio de uma viatura.
 *
 * Este ficheiro é a "fonte da verdade" de tipos. O mock (`data/vehicles.ts`)
 * e uma futura API REST devem ambos satisfazer estes tipos, de forma a que a
 * troca de fonte de dados seja transparente para os componentes.
 */

export type FuelType =
  | "Gasolina"
  | "Diesel"
  | "Híbrido"
  | "Híbrido Plug-in"
  | "Elétrico";

export type Transmission = "Manual" | "Automática";

export type BodyType =
  | "Berlina"
  | "SUV"
  | "Coupé"
  | "Carrinha"
  | "Citadino"
  | "Descapotável";

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
  /** Frase curta de marketing. */
  tagline: string;
  description: string;
  /** Primeira imagem = capa; restantes = galeria. */
  images: VehicleImage[];
  /** Ficha técnica alargada apresentada na secção pinned e no detalhe. */
  highlights: VehicleSpec[];
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
