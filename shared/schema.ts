import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  currency: z.enum(["USD", "EUR"]),
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

// Enums
export const uploadStatusEnum = pgEnum("upload_status", ["pending", "processing", "completed", "failed"]);

// ==================== SIMPLIFIED DATABASE TABLES ====================

// Users table (for authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Simplified Prices table - contains all pricing data from CSV
export const prices = pgTable("prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service_name: text("service_name").notNull(),
  category: text("category"), // e.g., "transport", "accommodation", "tour guide", etc.
  route_name: text("route_name"), // e.g., "Alexandria Airport Pickup", "Cairo Day Tour"
  cost_basis: text("cost_basis").notNull(), // "per_person", "per_group", "per_night", "per_day", "flat_rate"
  unit: text("unit"), // e.g., "transfer", "tour", "night", etc.
  unit_price: real("unit_price").notNull(),
  currency: text("currency").notNull().default("EUR"), // "USD" or "EUR"
  notes: text("notes"), // Additional notes or description
  vehicle_type: text("vehicle_type"), // e.g., "Sedan", "Hiace", "Coaster", "Coach"
  passenger_capacity: text("passenger_capacity"), // e.g., "1-2 pax", "3-7 pax"
  location: text("location"), // e.g., "Alexandria", "Cairo", "Luxor", etc.
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Quotations table (stores generated quotations)
export const quotations = pgTable("quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id),
  data: jsonb("data").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// CSV Uploads table (tracks CSV file uploads)
export const csvUploads = pgTable("csv_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  original_filename: text("original_filename").notNull(),
  file_path: text("file_path").notNull(),
  file_size: integer("file_size").notNull(),
  city: text("city").notNull(), // City assignment for this upload (e.g., "Alexandria", "Cairo")
  status: uploadStatusEnum("status").default("pending"),
  uploaded_by: varchar("uploaded_by").references(() => users.id),
  processed_at: timestamp("processed_at"),
  error_log: text("error_log"),
  records_processed: integer("records_processed").default(0),
  records_failed: integer("records_failed").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

// ==================== INSERT SCHEMAS ====================

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPriceSchema = createInsertSchema(prices).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCsvUploadSchema = createInsertSchema(csvUploads).omit({
  id: true,
  created_at: true,
});

// ==================== TYPES ====================

export type User = typeof users.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type QuotationRecord = typeof quotations.$inferSelect;
export type CsvUpload = typeof csvUploads.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPrice = z.infer<typeof insertPriceSchema>;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type InsertCsvUpload = z.infer<typeof insertCsvUploadSchema>;

// CSV row schema for validation (matches Alexandria CSV format)
export const csvRowSchema = z.object({
  service_name: z.string().min(1, "Service name is required"),
  category: z.string().optional(),
  route_name: z.string().optional(),
  cost_basis: z.string().min(1, "Cost basis is required"), // per_person, per_group, etc.
  unit: z.string().optional(), // transfer, tour, night, etc.
  base_cost: z.string().min(1, "Base cost is required"), // Will parse "20 €" format
  notes: z.string().optional(),
  vehicle_type: z.string().optional(),
  passenger_capacity: z.string().optional(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;
