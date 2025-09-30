import {
  type User,
  type InsertUser,
  type Price,
  type InsertPrice,
  type QuotationRecord,
  type InsertQuotation,
  type CsvUpload,
  type InsertCsvUpload,
  users,
  prices,
  quotations,
  csvUploads
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Price methods
  getPrices(filters?: {
    serviceName?: string;
    category?: string;
    currency?: string;
    location?: string;
    isActive?: boolean;
  }): Promise<Price[]>;
  getPrice(id: string): Promise<Price | undefined>;
  createPrice(price: InsertPrice): Promise<Price>;
  updatePrice(id: string, price: Partial<InsertPrice>): Promise<Price | undefined>;
  deletePrice(id: string): Promise<boolean>;
  bulkCreatePrices(pricesList: InsertPrice[]): Promise<Price[]>;

  // Quotation methods
  getQuotations(userId?: string): Promise<QuotationRecord[]>;
  getQuotation(id: string): Promise<QuotationRecord | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<QuotationRecord>;
  updateQuotation(id: string, quotation: Partial<InsertQuotation>): Promise<QuotationRecord | undefined>;
  deleteQuotation(id: string): Promise<boolean>;

  // CSV Upload methods
  getCsvUploads(uploadedBy?: string): Promise<CsvUpload[]>;
  getCsvUpload(id: string): Promise<CsvUpload | undefined>;
  createCsvUpload(upload: InsertCsvUpload): Promise<CsvUpload>;
  updateCsvUpload(id: string, upload: Partial<InsertCsvUpload>): Promise<CsvUpload | undefined>;
  deleteCsvUpload(id: string): Promise<boolean>;
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

  // Price methods
  async getPrices(filters?: {
    serviceName?: string;
    category?: string;
    currency?: string;
    location?: string;
    isActive?: boolean;
  }): Promise<Price[]> {
    const conditions = [];

    if (filters?.serviceName) {
      conditions.push(like(prices.service_name, `%${filters.serviceName}%`));
    }
    if (filters?.category) {
      conditions.push(eq(prices.category, filters.category));
    }
    if (filters?.currency) {
      conditions.push(eq(prices.currency, filters.currency));
    }
    if (filters?.location) {
      conditions.push(eq(prices.location, filters.location));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(prices.is_active, filters.isActive));
    } else {
      // Default to active prices only
      conditions.push(eq(prices.is_active, true));
    }

    if (conditions.length > 0) {
      return await db.select().from(prices).where(and(...conditions));
    }

    return await db.select().from(prices).where(eq(prices.is_active, true));
  }

  async getPrice(id: string): Promise<Price | undefined> {
    const [price] = await db.select().from(prices).where(eq(prices.id, id));
    return price || undefined;
  }

  async createPrice(price: InsertPrice): Promise<Price> {
    const [created] = await db
      .insert(prices)
      .values(price)
      .returning();
    return created;
  }

  async updatePrice(id: string, price: Partial<InsertPrice>): Promise<Price | undefined> {
    const [updated] = await db
      .update(prices)
      .set({ ...price, updated_at: new Date() })
      .where(eq(prices.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePrice(id: string): Promise<boolean> {
    const result = await db
      .update(prices)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(prices.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async bulkCreatePrices(pricesList: InsertPrice[]): Promise<Price[]> {
    if (pricesList.length === 0) return [];
    
    const created = await db
      .insert(prices)
      .values(pricesList)
      .returning();
    return created;
  }

  // Quotation methods
  async getQuotations(userId?: string): Promise<QuotationRecord[]> {
    if (userId) {
      return await db.select().from(quotations)
        .where(eq(quotations.user_id, userId))
        .orderBy(desc(quotations.created_at));
    }

    return await db.select().from(quotations).orderBy(desc(quotations.created_at));
  }

  async getQuotation(id: string): Promise<QuotationRecord | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    return quotation || undefined;
  }

  async createQuotation(quotation: InsertQuotation): Promise<QuotationRecord> {
    const [created] = await db
      .insert(quotations)
      .values(quotation)
      .returning();
    return created;
  }

  async updateQuotation(id: string, quotation: Partial<InsertQuotation>): Promise<QuotationRecord | undefined> {
    const [updated] = await db
      .update(quotations)
      .set({ ...quotation, updated_at: new Date() })
      .where(eq(quotations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteQuotation(id: string): Promise<boolean> {
    const result = await db.delete(quotations).where(eq(quotations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // CSV Upload methods
  async getCsvUploads(uploadedBy?: string): Promise<CsvUpload[]> {
    if (uploadedBy) {
      return await db.select().from(csvUploads)
        .where(eq(csvUploads.uploaded_by, uploadedBy))
        .orderBy(desc(csvUploads.created_at));
    }

    return await db.select().from(csvUploads).orderBy(desc(csvUploads.created_at));
  }

  async getCsvUpload(id: string): Promise<CsvUpload | undefined> {
    const [upload] = await db.select().from(csvUploads).where(eq(csvUploads.id, id));
    return upload || undefined;
  }

  async createCsvUpload(upload: InsertCsvUpload): Promise<CsvUpload> {
    const [created] = await db
      .insert(csvUploads)
      .values(upload)
      .returning();
    return created;
  }

  async updateCsvUpload(id: string, upload: Partial<InsertCsvUpload>): Promise<CsvUpload | undefined> {
    const [updated] = await db
      .update(csvUploads)
      .set(upload)
      .where(eq(csvUploads.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCsvUpload(id: string): Promise<boolean> {
    const result = await db.delete(csvUploads).where(eq(csvUploads.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
