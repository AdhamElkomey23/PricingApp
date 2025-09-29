import { 
  type User, 
  type InsertUser,
  type ServiceCategory,
  type InsertServiceCategory,
  type ServiceItem,
  type InsertServiceItem,
  type PricingRate,
  type InsertPricingRate,
  type Tour,
  type InsertTour,
  type TourVersion,
  type InsertTourVersion,
  type ExcelUpload,
  type InsertExcelUpload,
  users,
  serviceCategories,
  serviceItems,
  pricingRates,
  tours,
  tourVersions,
  excelUploads
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, or, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Service Category methods
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: string): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: string, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined>;
  deleteServiceCategory(id: string): Promise<boolean>;

  // Service Item methods
  getServiceItems(categoryId?: string): Promise<ServiceItem[]>;
  getServiceItem(id: string): Promise<ServiceItem | undefined>;
  createServiceItem(item: InsertServiceItem): Promise<ServiceItem>;
  updateServiceItem(id: string, item: Partial<InsertServiceItem>): Promise<ServiceItem | undefined>;
  deleteServiceItem(id: string): Promise<boolean>;

  // Pricing Rate methods
  getPricingRates(filters?: {
    serviceId?: string;
    currency?: string;
    profile?: string;
    effectiveDate?: string;
  }): Promise<PricingRate[]>;
  getPricingRate(id: string): Promise<PricingRate | undefined>;
  createPricingRate(rate: InsertPricingRate): Promise<PricingRate>;
  updatePricingRate(id: string, rate: Partial<InsertPricingRate>): Promise<PricingRate | undefined>;
  deletePricingRate(id: string): Promise<boolean>;

  // Tour methods
  getTours(filters?: {
    status?: string;
    createdBy?: string;
  }): Promise<Tour[]>;
  getTour(id: string): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined>;
  deleteTour(id: string): Promise<boolean>;

  // Tour Version methods
  getTourVersions(tourId: string): Promise<TourVersion[]>;
  getTourVersion(id: string): Promise<TourVersion | undefined>;
  createTourVersion(version: InsertTourVersion): Promise<TourVersion>;
  getLatestTourVersion(tourId: string): Promise<TourVersion | undefined>;

  // Excel Upload methods
  getExcelUploads(uploadedBy?: string): Promise<ExcelUpload[]>;
  getExcelUpload(id: string): Promise<ExcelUpload | undefined>;
  createExcelUpload(upload: InsertExcelUpload): Promise<ExcelUpload>;
  updateExcelUpload(id: string, upload: Partial<InsertExcelUpload>): Promise<ExcelUpload | undefined>;
  deleteExcelUpload(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Service Category methods
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return await db.select().from(serviceCategories).where(eq(serviceCategories.is_active, true));
  }

  async getServiceCategory(id: string): Promise<ServiceCategory | undefined> {
    const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
    return category || undefined;
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const [created] = await db
      .insert(serviceCategories)
      .values(category)
      .returning();
    return created;
  }

  async updateServiceCategory(id: string, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined> {
    const [updated] = await db
      .update(serviceCategories)
      .set({ ...category, updated_at: new Date() })
      .where(eq(serviceCategories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteServiceCategory(id: string): Promise<boolean> {
    const result = await db
      .update(serviceCategories)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(serviceCategories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Service Item methods
  async getServiceItems(categoryId?: string): Promise<ServiceItem[]> {
    if (categoryId) {
      return await db.select().from(serviceItems).where(
        and(
          eq(serviceItems.is_active, true),
          eq(serviceItems.category_id, categoryId)
        )
      );
    }
    return await db.select().from(serviceItems).where(eq(serviceItems.is_active, true));
  }

  async getServiceItem(id: string): Promise<ServiceItem | undefined> {
    const [item] = await db.select().from(serviceItems).where(eq(serviceItems.id, id));
    return item || undefined;
  }

  async createServiceItem(item: InsertServiceItem): Promise<ServiceItem> {
    const [created] = await db
      .insert(serviceItems)
      .values(item)
      .returning();
    return created;
  }

  async updateServiceItem(id: string, item: Partial<InsertServiceItem>): Promise<ServiceItem | undefined> {
    const [updated] = await db
      .update(serviceItems)
      .set({ ...item, updated_at: new Date() })
      .where(eq(serviceItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteServiceItem(id: string): Promise<boolean> {
    const result = await db
      .update(serviceItems)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(serviceItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Pricing Rate methods
  async getPricingRates(filters?: {
    serviceId?: string;
    currency?: string;
    profile?: string;
    effectiveDate?: string;
  }): Promise<PricingRate[]> {
    const conditions = [eq(pricingRates.is_active, true)];
    
    if (filters?.serviceId) {
      conditions.push(eq(pricingRates.service_id, filters.serviceId));
    }
    if (filters?.currency) {
      conditions.push(eq(pricingRates.currency, filters.currency as any));
    }
    if (filters?.profile) {
      conditions.push(eq(pricingRates.profile, filters.profile as any));
    }
    if (filters?.effectiveDate) {
      const date = new Date(filters.effectiveDate);
      conditions.push(
        and(
          lte(pricingRates.effective_from, date),
          or(
            isNull(pricingRates.effective_to),
            gte(pricingRates.effective_to, date)
          )
        )!
      );
    }
    
    return await db.select().from(pricingRates).where(conditions.length > 1 ? and(...conditions) : conditions[0]);
  }

  async getPricingRate(id: string): Promise<PricingRate | undefined> {
    const [rate] = await db.select().from(pricingRates).where(eq(pricingRates.id, id));
    return rate || undefined;
  }

  async createPricingRate(rate: InsertPricingRate): Promise<PricingRate> {
    const [created] = await db
      .insert(pricingRates)
      .values(rate)
      .returning();
    return created;
  }

  async updatePricingRate(id: string, rate: Partial<InsertPricingRate>): Promise<PricingRate | undefined> {
    const [updated] = await db
      .update(pricingRates)
      .set({ ...rate, updated_at: new Date() })
      .where(eq(pricingRates.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePricingRate(id: string): Promise<boolean> {
    const result = await db
      .update(pricingRates)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(pricingRates.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Tour methods
  async getTours(filters?: {
    status?: string;
    createdBy?: string;
  }): Promise<Tour[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(tours.status, filters.status as any));
    }
    if (filters?.createdBy) {
      conditions.push(eq(tours.created_by, filters.createdBy));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(tours).where(and(...conditions)).orderBy(desc(tours.created_at));
    }
    
    return await db.select().from(tours).orderBy(desc(tours.created_at));
  }

  async getTour(id: string): Promise<Tour | undefined> {
    const [tour] = await db.select().from(tours).where(eq(tours.id, id));
    return tour || undefined;
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const [created] = await db
      .insert(tours)
      .values(tour)
      .returning();
    return created;
  }

  async updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const [updated] = await db
      .update(tours)
      .set({ ...tour, updated_at: new Date() })
      .where(eq(tours.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTour(id: string): Promise<boolean> {
    const result = await db.delete(tours).where(eq(tours.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Tour Version methods
  async getTourVersions(tourId: string): Promise<TourVersion[]> {
    return await db
      .select()
      .from(tourVersions)
      .where(eq(tourVersions.tour_id, tourId))
      .orderBy(desc(tourVersions.version_number));
  }

  async getTourVersion(id: string): Promise<TourVersion | undefined> {
    const [version] = await db.select().from(tourVersions).where(eq(tourVersions.id, id));
    return version || undefined;
  }

  async createTourVersion(version: InsertTourVersion): Promise<TourVersion> {
    const [created] = await db
      .insert(tourVersions)
      .values(version)
      .returning();
    return created;
  }

  async getLatestTourVersion(tourId: string): Promise<TourVersion | undefined> {
    const [version] = await db
      .select()
      .from(tourVersions)
      .where(eq(tourVersions.tour_id, tourId))
      .orderBy(desc(tourVersions.version_number))
      .limit(1);
    return version || undefined;
  }

  // Excel Upload methods
  async getExcelUploads(uploadedBy?: string): Promise<ExcelUpload[]> {
    if (uploadedBy) {
      return await db.select().from(excelUploads)
        .where(eq(excelUploads.uploaded_by, uploadedBy))
        .orderBy(desc(excelUploads.created_at));
    }
    
    return await db.select().from(excelUploads).orderBy(desc(excelUploads.created_at));
  }

  async getExcelUpload(id: string): Promise<ExcelUpload | undefined> {
    const [upload] = await db.select().from(excelUploads).where(eq(excelUploads.id, id));
    return upload || undefined;
  }

  async createExcelUpload(upload: InsertExcelUpload): Promise<ExcelUpload> {
    const [created] = await db
      .insert(excelUploads)
      .values(upload)
      .returning();
    return created;
  }

  async updateExcelUpload(id: string, upload: Partial<InsertExcelUpload>): Promise<ExcelUpload | undefined> {
    const [updated] = await db
      .update(excelUploads)
      .set({ ...upload, updated_at: new Date() })
      .where(eq(excelUploads.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExcelUpload(id: string): Promise<boolean> {
    const result = await db.delete(excelUploads).where(eq(excelUploads.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
