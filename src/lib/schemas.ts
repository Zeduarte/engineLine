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
  })
  .refine((v) => v.price_on_request || (v.price != null && v.price > 0), {
    message: "Indique um preço ou marque 'sob consulta'",
    path: ["price"],
  });

export type CarFormValues = z.infer<typeof carFormSchema>;

/** Formulário público de lead (contacto / test drive / retoma / encomenda). */
export const leadSchema = z.object({
  kind: z
    .enum(["contact", "test_drive", "finance", "trade_in", "order"])
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
export const siteSettingsSchema = z.object({
  company_name: z.string().trim().min(1, "Indique o nome da empresa").max(60),
  tagline: z.string().trim().max(160).optional().or(z.literal("")),
  logo_url: z.string().trim().max(400).nullable().optional(),
});
export type SiteSettingsValues = z.infer<typeof siteSettingsSchema>;

// ---- Novo utilizador (admin) ----------------------------------------------
export const newUserSchema = z.object({
  full_name: z.string().trim().min(2, "Indique o nome").max(80),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  role: z.enum(["admin", "vendedor"]).default("vendedor"),
});
export type NewUserValues = z.infer<typeof newUserSchema>;
