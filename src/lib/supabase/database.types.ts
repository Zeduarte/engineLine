/**
 * Tipos da base de dados.
 *
 * Escritos à mão a espelhar `supabase/migrations/0001_init.sql`. Em produção
 * podem ser (re)gerados com:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema public \
 *     > src/lib/supabase/database.types.ts
 *
 * Manter sincronizado com o schema é a fonte da verdade de tipos do backend.
 */

export type UserRole = "admin" | "vendedor";
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
export type CarStatus = "draft" | "published" | "reserved" | "sold";
export type MediaKind = "image" | "video";
export type LeadKind =
  | "contact"
  | "test_drive"
  | "finance"
  | "trade_in"
  | "order"
  | "reservation";
export type LeadStatus =
  | "new"
  | "contacted"
  | "proposal"
  | "won"
  | "lost"
  | "closed";

export type HighlightJson = {
  label: string;
  value: string;
}

// ---- profiles --------------------------------------------------------------
type ProfilesRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
type ProfilesInsert = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: UserRole;
}
type ProfilesUpdate = {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  role?: UserRole;
}

// ---- cars ------------------------------------------------------------------
type CarsRow = {
  id: string;
  slug: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  license_plate: string | null;
  mileage: number;
  fuel: FuelType;
  transmission: Transmission;
  body: BodyType;
  power: number;
  displacement: number;
  color: string | null;
  doors: number;
  seats: number;
  price: number | null;
  price_on_request: boolean;
  status: CarStatus;
  featured: boolean;
  tagline: string | null;
  description: string | null;
  extras: string[];
  location: string | null;
  highlights: HighlightJson[];
  previous_price: number | null;
  national: boolean;
  owners: number | null;
  first_owner: boolean;
  service_book: boolean;
  warranty_months: number | null;
  last_inspection: string | null;
  channels: string[];
  created_by: string | null;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}
type CarsInsert = {
  id?: string;
  slug: string;
  make: string;
  model: string;
  variant?: string | null;
  year: number;
  license_plate?: string | null;
  mileage?: number;
  fuel: FuelType;
  transmission: Transmission;
  body: BodyType;
  power?: number;
  displacement?: number;
  color?: string | null;
  doors?: number;
  seats?: number;
  price?: number | null;
  price_on_request?: boolean;
  status?: CarStatus;
  featured?: boolean;
  tagline?: string | null;
  description?: string | null;
  extras?: string[];
  location?: string | null;
  highlights?: HighlightJson[];
  previous_price?: number | null;
  national?: boolean;
  owners?: number | null;
  first_owner?: boolean;
  service_book?: boolean;
  warranty_months?: number | null;
  last_inspection?: string | null;
  channels?: string[];
  created_by?: string | null;
}
type CarsUpdate = Partial<CarsInsert>;

// ---- car_media -------------------------------------------------------------
type CarMediaRowT = {
  id: string;
  car_id: string;
  kind: MediaKind;
  storage_path: string;
  alt: string;
  position: number;
  is_cover: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
}
type CarMediaInsert = {
  id?: string;
  car_id: string;
  kind?: MediaKind;
  storage_path: string;
  alt?: string;
  position?: number;
  is_cover?: boolean;
  width?: number | null;
  height?: number | null;
}
type CarMediaUpdate = Partial<CarMediaInsert>;

// ---- leads -----------------------------------------------------------------
type LeadsRow = {
  id: string;
  car_id: string | null;
  car_label: string | null;
  kind: LeadKind;
  status: LeadStatus;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  preferred_date: string | null;
  notes: string | null;
  car_details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
type LeadsInsert = {
  id?: string;
  car_id?: string | null;
  car_label?: string | null;
  kind?: LeadKind;
  status?: LeadStatus;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  preferred_date?: string | null;
  notes?: string | null;
  car_details?: Record<string, unknown>;
}
type LeadsUpdate = Partial<LeadsInsert>;

// ---- site_content ----------------------------------------------------------
type SiteContentRow = {
  key: string;
  content: Record<string, unknown>;
  updated_at: string;
};
type SiteContentInsert = {
  key: string;
  content?: Record<string, unknown>;
};
type SiteContentUpdate = Partial<SiteContentInsert>;

// ---- site_settings ---------------------------------------------------------
type SiteSettingsRow = {
  id: number;
  company_name: string;
  logo_url: string | null;
  tagline: string | null;
  accent: string;
  accent_soft: string;
  ga4_id: string | null;
  pixel_id: string | null;
  reservation_enabled: boolean;
  deposit_amount: number;
  updated_at: string;
};
type SiteSettingsInsert = {
  id?: number;
  company_name?: string;
  logo_url?: string | null;
  tagline?: string | null;
  accent?: string;
  accent_soft?: string;
  ga4_id?: string | null;
  pixel_id?: string | null;
  reservation_enabled?: boolean;
  deposit_amount?: number;
};
type SiteSettingsUpdate = Partial<SiteSettingsInsert>;

// ---- testimonials ----------------------------------------------------------
type TestimonialsRow = {
  id: string;
  name: string;
  rating: number;
  body: string;
  role: string | null;
  published: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};
type TestimonialsInsert = {
  id?: string;
  name: string;
  rating?: number;
  body: string;
  role?: string | null;
  published?: boolean;
  position?: number;
};
type TestimonialsUpdate = Partial<TestimonialsInsert>;

// ---- car_views -------------------------------------------------------------
type CarViewsRow = {
  id: number;
  car_id: string | null;
  slug: string | null;
  session: string | null;
  created_at: string;
};
type CarViewsInsert = {
  car_id?: string | null;
  slug?: string | null;
  session?: string | null;
};
type CarViewsUpdate = Partial<CarViewsInsert>;

// ---- integration_secrets ---------------------------------------------------
type IntegrationSecretsRow = {
  id: number;
  data: Record<string, unknown>;
  updated_at: string;
};
type IntegrationSecretsInsert = {
  id?: number;
  data?: Record<string, unknown>;
};
type IntegrationSecretsUpdate = Partial<IntegrationSecretsInsert>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
        Relationships: [];
      };
      cars: {
        Row: CarsRow;
        Insert: CarsInsert;
        Update: CarsUpdate;
        Relationships: [];
      };
      car_media: {
        Row: CarMediaRowT;
        Insert: CarMediaInsert;
        Update: CarMediaUpdate;
        Relationships: [];
      };
      leads: {
        Row: LeadsRow;
        Insert: LeadsInsert;
        Update: LeadsUpdate;
        Relationships: [];
      };
      site_content: {
        Row: SiteContentRow;
        Insert: SiteContentInsert;
        Update: SiteContentUpdate;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSettingsRow;
        Insert: SiteSettingsInsert;
        Update: SiteSettingsUpdate;
        Relationships: [];
      };
      testimonials: {
        Row: TestimonialsRow;
        Insert: TestimonialsInsert;
        Update: TestimonialsUpdate;
        Relationships: [];
      };
      car_views: {
        Row: CarViewsRow;
        Insert: CarViewsInsert;
        Update: CarViewsUpdate;
        Relationships: [];
      };
      integration_secrets: {
        Row: IntegrationSecretsRow;
        Insert: IntegrationSecretsInsert;
        Update: IntegrationSecretsUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      fuel_type: FuelType;
      transmission: Transmission;
      body_type: BodyType;
      car_status: CarStatus;
      media_kind: MediaKind;
      lead_kind: LeadKind;
      lead_status: LeadStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type CarRow = CarsRow;
export type CarInsert = CarsInsert;
export type CarUpdate = CarsUpdate;
export type CarMediaRow = CarMediaRowT;
export type LeadRow = LeadsRow;
export type ProfileRow = ProfilesRow;

/** Carro com a sua media (join usado nas queries). */
export type CarWithMedia = CarRow & { car_media: CarMediaRow[] };
