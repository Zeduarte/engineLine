import { z } from "zod";

/**
 * Esquemas de validação partilhados (cliente + servidor).
 *
 * O mesmo `carFormSchema` valida o formulário (React Hook Form) e a Server
 * Action — nunca confiar apenas no cliente.
 */

export const FUEL_TYPES = [
  "Gasolina",
  "Diesel",
  "Híbrido",
  "Híbrido Plug-in",
  "Elétrico",
  "GPL",
] as const;

export const TRANSMISSIONS = ["Manual", "Automática"] as const;

export const BODY_TYPES = [
  "Berlina",
  "SUV",
  "Coupé",
  "Carrinha",
  "Citadino",
  "Descapotável",
  "Monovolume",
] as const;

export const CAR_STATUSES = ["draft", "published", "reserved", "sold"] as const;

/**
 * Plataformas/portais externos para onde o inventário pode ser exportado.
 * O `id` é usado no URL do feed (`/api/feeds/<id>.xml`) e nas credenciais.
 */
export const CHANNELS = [
  { id: "standvirtual", label: "StandVirtual" },
  { id: "olx", label: "OLX" },
  { id: "autosapo", label: "auto SAPO" },
  { id: "custojusto", label: "CustoJusto" },
  { id: "piscapisca", label: "Piscapisca" },
] as const;

export const CHANNEL_IDS = CHANNELS.map((c) => c.id);
export type ChannelId = (typeof CHANNELS)[number]["id"];

export const carFormSchema = z
  .object({
    make: z.string().trim().min(1, "Indique a marca"),
    model: z.string().trim().min(1, "Indique o modelo"),
    variant: z.string().trim().max(80).optional().or(z.literal("")),
    year: z.coerce
      .number()
      .int()
      .min(1950, "Ano inválido")
      .max(new Date().getFullYear() + 1, "Ano inválido"),
    license_plate: z.string().trim().max(20).optional().or(z.literal("")),

    mileage: z.coerce.number().int().min(0, "Km inválidos"),
    fuel: z.enum(FUEL_TYPES),
    transmission: z.enum(TRANSMISSIONS),
    body: z.enum(BODY_TYPES),
    power: z.coerce.number().int().min(0).default(0),
    displacement: z.coerce.number().int().min(0).default(0),
    color: z.string().trim().max(60).optional().or(z.literal("")),
    doors: z.coerce.number().int().min(1).max(9).default(5),
    seats: z.coerce.number().int().min(1).max(9).default(5),

    price_on_request: z.boolean().default(false),
    price: z.coerce.number().int().min(0).nullable().optional(),
    status: z.enum(CAR_STATUSES).default("draft"),
    featured: z.boolean().default(false),

    tagline: z.string().trim().max(160).optional().or(z.literal("")),
    description: z.string().trim().max(5000).optional().or(z.literal("")),
    extras: z.array(z.string().trim().min(1)).default([]),
    location: z.string().trim().max(120).optional().or(z.literal("")),

    // Transparência / badges
    previous_price: z.coerce.number().int().min(0).nullable().optional(),
    national: z.boolean().default(false),
    owners: z.coerce.number().int().min(0).max(20).nullable().optional(),
    first_owner: z.boolean().default(false),
    service_book: z.boolean().default(false),
    warranty_months: z.coerce.number().int().min(0).max(120).nullable().optional(),
    last_inspection: z.string().optional().or(z.literal("")),

    // Exportação multi-canal (portais externos onde publicar)
    channels: z.array(z.string().trim().min(1)).default([]),
  })
  .refine((v) => v.price_on_request || (v.price != null && v.price > 0), {
    message: "Indique um preço ou marque 'sob consulta'",
    path: ["price"],
  });

export type CarFormValues = z.infer<typeof carFormSchema>;

/** Formulário público de lead (contacto / test drive / retoma / encomenda). */
export const leadSchema = z.object({
  kind: z
    .enum([
      "contact",
      "test_drive",
      "finance",
      "trade_in",
      "order",
      "reservation",
      "offer",
    ])
    .default("contact"),
  car_id: z.string().uuid().nullable().optional(),
  car_label: z.string().max(160).optional().or(z.literal("")),
  name: z.string().trim().min(2, "Indique o seu nome"),
  email: z.string().trim().email("Email inválido"),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s+]{9,}$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  preferred_date: z.string().optional().or(z.literal("")),
  /** JSON com detalhes extra (ex.: carro de retoma). */
  details: z.string().max(4000).optional().or(z.literal("")),
});

export type LeadValues = z.infer<typeof leadSchema>;

/** Testemunho submetido publicamente por um visitante (entra por aprovar). */
export const publicTestimonialSchema = z.object({
  name: z.string().trim().min(2, "Indique o seu nome").max(80),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  role: z.string().trim().max(80).optional().or(z.literal("")),
  body: z
    .string()
    .trim()
    .min(10, "Escreva pelo menos algumas palavras")
    .max(1000),
});
export type PublicTestimonialValues = z.infer<typeof publicTestimonialSchema>;

// ---- Conteúdo da página inicial -------------------------------------------
const cta = z.object({
  label: z.string().trim().max(60),
  href: z.string().trim().max(200),
});

export const homeContentSchema = z.object({
  hero: z.object({
    eyebrow: z.string().trim().max(80),
    title: z.string().trim().min(1, "Título obrigatório").max(160),
    subtitle: z.string().trim().max(300),
    primaryCta: cta,
    secondaryCta: cta,
  }),
  brands: z.array(z.string().trim().min(1)).max(30),
  trust: z.object({
    eyebrow: z.string().trim().max(80),
    title: z.string().trim().max(160),
    pillars: z
      .array(
        z.object({
          kpi: z.string().trim().max(20),
          title: z.string().trim().max(80),
          body: z.string().trim().max(400),
        }),
      )
      .max(8),
  }),
  cta: z.object({
    eyebrow: z.string().trim().max(80),
    title: z.string().trim().max(160),
    whatsappLabel: z.string().trim().max(60),
    secondary: cta,
  }),
});

export type HomeContentValues = z.infer<typeof homeContentSchema>;

// ---- Marca do site (admin) -------------------------------------------------
const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{6})$/, "Cor inválida (use #RRGGBB)");

export const siteSettingsSchema = z.object({
  company_name: z.string().trim().min(1, "Indique o nome da empresa").max(60),
  tagline: z.string().trim().max(160).optional().or(z.literal("")),
  logo_url: z.string().trim().max(400).nullable().optional(),
  accent: hexColor.default("#E8B15A"),
  accent_soft: hexColor.default("#C8934A"),
});
export type SiteSettingsValues = z.infer<typeof siteSettingsSchema>;

// ---- Dados de contacto / empresa (admin) ----------------------------------
export const companySchema = z.object({
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(120)
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .regex(/^\d*$/, "Só dígitos, com indicativo (ex.: 351910000000)")
    .optional()
    .or(z.literal("")),
  messenger: z.string().trim().max(200).optional().or(z.literal("")),
  address_street: z.string().trim().max(160).optional().or(z.literal("")),
  address_city: z.string().trim().max(80).optional().or(z.literal("")),
  address_postal: z.string().trim().max(20).optional().or(z.literal("")),
  address_country: z.string().trim().max(60).optional().or(z.literal("")),
  hours: z.string().trim().max(120).optional().or(z.literal("")),
  geo_lat: z.coerce.number().min(-90).max(90).nullable().optional(),
  geo_lng: z.coerce.number().min(-180).max(180).nullable().optional(),
});
export type CompanyValues = z.infer<typeof companySchema>;

// ---- Marketing, reservas e consentimento (admin) --------------------------
export const marketingSchema = z.object({
  ga4_id: z
    .string()
    .trim()
    .max(40)
    .regex(/^(G-[A-Z0-9]+)?$/i, "ID GA4 inválido (ex.: G-XXXXXXX)")
    .optional()
    .or(z.literal("")),
  pixel_id: z
    .string()
    .trim()
    .max(40)
    .regex(/^\d*$/, "ID do Pixel inválido (só dígitos)")
    .optional()
    .or(z.literal("")),
  reservation_enabled: z.boolean().default(false),
  deposit_amount: z.coerce.number().int().min(0).max(100000).default(500),
});
export type MarketingValues = z.infer<typeof marketingSchema>;

// ---- Integrações / credenciais das plataformas (admin) --------------------
const channelCred = z
  .object({
    username: z.string().trim().max(120).optional().or(z.literal("")),
    token: z.string().trim().max(400).optional().or(z.literal("")),
    enabled: z.boolean().default(false),
  })
  .partial()
  .default({});

export const integrationsSchema = z.object({
  standvirtual: channelCred,
  olx: channelCred,
  autosapo: channelCred,
  custojusto: channelCred,
  piscapisca: channelCred,
  stripe_secret: z.string().trim().max(200).optional().or(z.literal("")),
  feed_token: z.string().trim().max(80).optional().or(z.literal("")),
});
export type IntegrationsValues = z.infer<typeof integrationsSchema>;

// ---- Novo utilizador (admin) ----------------------------------------------
export const newUserSchema = z.object({
  full_name: z.string().trim().min(2, "Indique o nome").max(80),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  role: z.enum(["admin", "chefe", "vendedor"]).default("vendedor"),
  /** Separadores a que o novo utilizador terá acesso (opcional). */
  allowed_sections: z.array(z.string()).optional(),
});
export type NewUserValues = z.infer<typeof newUserSchema>;
