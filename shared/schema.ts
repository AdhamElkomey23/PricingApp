import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, jsonb, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Service Categories (legacy enum for compatibility)
export type ServiceCategoryType = 
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

// Enums for database
export const currencyEnum = pgEnum("currency", ["EGP", "USD", "EUR"]);
export const pricingProfileEnum = pgEnum("pricing_profile", ["Base", "+Tickets", "+Tickets+Lunch"]);
export const accommodationModeEnum = pgEnum("accommodation_mode", ["per_person", "per_room"]);
export const uploadStatusEnum = pgEnum("upload_status", ["pending", "processing", "completed", "failed"]);
export const tourStatusEnum = pgEnum("tour_status", ["draft", "active", "archived", "invoiced"]);

// Service Categories table
export const serviceCategories = pgTable("service_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Service Items table
export const serviceItems = pgTable("service_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category_id: varchar("category_id").references(() => serviceCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  unit_type: text("unit_type").notNull(), // 'per_person', 'per_group', 'per_night', etc.
  default_quantity: integer("default_quantity").default(1),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Pricing Rates table
export const pricingRates = pgTable("pricing_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service_id: varchar("service_id").references(() => serviceItems.id),
  currency: currencyEnum("currency").notNull(),
  profile: pricingProfileEnum("profile").notNull(),
  unit_price: real("unit_price").notNull(),
  effective_from: timestamp("effective_from").notNull(),
  effective_to: timestamp("effective_to"),
  season: text("season"), // 'high', 'low', 'peak', etc.
  markup_override: real("markup_override"), // Optional markup override for specific services
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tours table
export const tours = pgTable("tours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  client_name: text("client_name"),
  client_email: text("client_email"),
  description: text("description"),
  status: tourStatusEnum("status").default("draft"),
  original_itinerary_text: text("original_itinerary_text"),
  num_days: integer("num_days").notNull(),
  num_people: integer("num_people").notNull(),
  start_date: timestamp("start_date"),
  created_by: varchar("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tour Versions table (for versioning/history)
export const tourVersions = pgTable("tour_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tour_id: varchar("tour_id").references(() => tours.id),
  version_number: integer("version_number").notNull(),
  parsed_itinerary: jsonb("parsed_itinerary").notNull(),
  pricing_config: jsonb("pricing_config").notNull(),
  pricing_totals: jsonb("pricing_totals").notNull(),
  notes: text("notes"),
  created_by: varchar("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// Tour Services table (links tours to specific services with applied prices)
export const tourServices = pgTable("tour_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tour_version_id: varchar("tour_version_id").references(() => tourVersions.id),
  service_id: varchar("service_id").references(() => serviceItems.id),
  day_number: integer("day_number").notNull(),
  quantity: integer("quantity").default(1),
  unit_price: real("unit_price").notNull(),
  total_price: real("total_price").notNull(),
  is_included: boolean("is_included").default(true),
  override_reason: text("override_reason"),
  created_at: timestamp("created_at").defaultNow(),
});

// Excel Uploads table
export const excelUploads = pgTable("excel_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  original_filename: text("original_filename").notNull(),
  file_path: text("file_path").notNull(),
  file_size: integer("file_size").notNull(),
  status: uploadStatusEnum("status").default("pending"),
  uploaded_by: varchar("uploaded_by").references(() => users.id),
  processed_at: timestamp("processed_at"),
  error_log: text("error_log"),
  records_processed: integer("records_processed"),
  records_failed: integer("records_failed"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// New Zod schemas for the new tables
export const serviceCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const serviceItemSchema = z.object({
  id: z.string().optional(),
  category_id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  unit_type: z.enum(["per_person", "per_group", "per_night", "per_day", "flat_rate"]),
  default_quantity: z.number().int().positive().default(1),
  is_active: z.boolean().default(true),
});

export const pricingRateSchema = z.object({
  id: z.string().optional(),
  service_id: z.string(),
  currency: z.enum(["EGP", "USD", "EUR"]),
  profile: z.enum(["Base", "+Tickets", "+Tickets+Lunch"]),
  unit_price: z.number().positive(),
  effective_from: z.string().datetime(),
  effective_to: z.string().datetime().optional(),
  season: z.string().optional(),
  markup_override: z.number().optional(),
  is_active: z.boolean().default(true),
});

export const tourSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  client_name: z.string().optional(),
  client_email: z.string().email().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived", "invoiced"]).default("draft"),
  original_itinerary_text: z.string().optional(),
  num_days: z.number().int().positive(),
  num_people: z.number().int().positive(),
  start_date: z.string().datetime().optional(),
  created_by: z.string().optional(),
});

export const tourVersionSchema = z.object({
  id: z.string().optional(),
  tour_id: z.string(),
  version_number: z.number().int().positive(),
  parsed_itinerary: parsedItinerarySchema,
  pricing_config: pricingConfigSchema,
  pricing_totals: pricingTotalsSchema,
  notes: z.string().optional(),
  created_by: z.string().optional(),
});

export const excelUploadSchema = z.object({
  id: z.string().optional(),
  filename: z.string().min(1),
  original_filename: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().int().positive(),
  status: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
  uploaded_by: z.string().optional(),
  processed_at: z.string().datetime().optional(),
  error_log: z.string().optional(),
  records_processed: z.number().int().optional(),
  records_failed: z.number().int().optional(),
});

// Insert schemas
export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertServiceItemSchema = createInsertSchema(serviceItems).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPricingRateSchema = createInsertSchema(pricingRates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTourSchema = createInsertSchema(tours).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTourVersionSchema = createInsertSchema(tourVersions).omit({
  id: true,
  created_at: true,
});

export const insertExcelUploadSchema = createInsertSchema(excelUploads).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type ServiceItem = typeof serviceItems.$inferSelect;
export type PricingRate = typeof pricingRates.$inferSelect;
export type Tour = typeof tours.$inferSelect;
export type TourVersion = typeof tourVersions.$inferSelect;
export type TourService = typeof tourServices.$inferSelect;
export type ExcelUpload = typeof excelUploads.$inferSelect;

export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type InsertServiceItem = z.infer<typeof insertServiceItemSchema>;
export type InsertPricingRate = z.infer<typeof insertPricingRateSchema>;
export type InsertTour = z.infer<typeof insertTourSchema>;
export type InsertTourVersion = z.infer<typeof insertTourVersionSchema>;
export type InsertExcelUpload = z.infer<typeof insertExcelUploadSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type QuotationRecord = typeof quotations.$inferSelect;