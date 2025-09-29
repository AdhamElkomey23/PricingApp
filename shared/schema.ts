import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Service Categories
export type ServiceCategory = 
  | "Airport Services"
  | "Hotel Services" 
  | "Train Station Services"
  | "Tour Services"
  | "Special Activities & Rides"
  | "Transportation Fees"
  | "Administrative Fees";

// Egypt city codes
export type EgyptCityCode = "CAI" | "LXR" | "ASW" | "ABS" | "HRG" | "SSH";

// Currency types
export type Currency = "EGP" | "USD" | "EUR";

// Pricing profiles
export type PricingProfile = "Base" | "+Tickets" | "+Tickets+Lunch";

// Service definition
export const serviceSchema = z.object({
  service: z.string(),
  reason: z.string(),
  quantity: z.number().optional(),
  nights: z.number().optional(),
  board: z.string().optional(),
  unitPrice: z.number().optional(),
  included: z.boolean().default(true),
  override: z.string().optional(),
});

export type Service = z.infer<typeof serviceSchema>;

// Daily breakdown
export const dailyBreakdownSchema = z.object({
  day: z.number(),
  label: z.string(),
  city_or_region: z.string(),
  activities_detected: z.array(z.string()),
  per_group: z.array(serviceSchema),
  per_person: z.array(serviceSchema),
  notes: z.string().optional(),
});

export type DailyBreakdown = z.infer<typeof dailyBreakdownSchema>;

// Itinerary parsing input
export const itineraryInputSchema = z.object({
  num_days: z.number().min(1).max(30),
  num_people: z.number().min(1).max(100),
  start_date: z.string().optional(),
  itinerary_text: z.string().min(10),
});

export type ItineraryInput = z.infer<typeof itineraryInputSchema>;

// Parsed itinerary result
export const parsedItinerarySchema = z.object({
  overview: z.object({
    num_days: z.number(),
    num_people: z.number(),
    cities_detected: z.array(z.string()),
    ground_handler_fees: z.record(z.string()),
  }),
  days: z.array(dailyBreakdownSchema),
  final_day_adjustments: z.array(z.string()),
  assumptions: z.array(z.string()),
  missing_info: z.array(z.string()),
});

export type ParsedItinerary = z.infer<typeof parsedItinerarySchema>;

// Pricing configuration
export const pricingConfigSchema = z.object({
  currency: z.enum(["EGP", "USD", "EUR"]),
  exchange_rate: z.number().default(1),
  tax_rate: z.number().default(0.12),
  markup_rate: z.number().default(0.20),
  rounding_increment: z.number().default(50),
  accommodation_mode: z.enum(["per_person", "per_room"]),
  occupancy: z.number().default(2),
  single_supplement: z.number().optional(),
  profile: z.enum(["Base", "+Tickets", "+Tickets+Lunch"]),
});

export type PricingConfig = z.infer<typeof pricingConfigSchema>;

// Pricing totals
export const pricingTotalsSchema = z.object({
  net_per_person: z.number(),
  tax_amount: z.number(), 
  markup_amount: z.number(),
  sell_per_person: z.number(),
  sell_per_group: z.number(),
  daily_totals: z.array(z.object({
    day: z.number(),
    net_total: z.number(),
    sell_total: z.number(),
  })),
});

export type PricingTotals = z.infer<typeof pricingTotalsSchema>;

// Complete quotation
export const quotationSchema = z.object({
  input: itineraryInputSchema,
  parsed_itinerary: parsedItinerarySchema,
  pricing_config: pricingConfigSchema,
  pricing_totals: pricingTotalsSchema,
  created_at: z.string(),
});

export type Quotation = z.infer<typeof quotationSchema>;

// Database tables (keeping existing users table for auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const quotations = pgTable("quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id),
  data: jsonb("data").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type QuotationRecord = typeof quotations.$inferSelect;