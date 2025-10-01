import {
  type User,
  type InsertUser,
  type Price,
  type InsertPrice,
  type QuotationRecord,
  type InsertQuotation,
  type CsvUpload,
  type InsertCsvUpload,
  type EntranceFee,
  type InsertEntranceFee,
  users,
  prices,
  entranceFees,
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

  // Entrance Fee methods
  getEntranceFees(filters?: {
    city?: string;
    siteName?: string;
    isActive?: boolean;
  }): Promise<EntranceFee[]>;
  getEntranceFee(id: string): Promise<EntranceFee | undefined>;
  createEntranceFee(entranceFee: InsertEntranceFee): Promise<EntranceFee>;
  updateEntranceFee(id: string, entranceFee: Partial<InsertEntranceFee>): Promise<EntranceFee | undefined>;
  deleteEntranceFee(id: string): Promise<boolean>;
  bulkCreateEntranceFees(entranceFeesData: InsertEntranceFee[]): Promise<EntranceFee[]>;
  ensureEntranceFeesTableExists(): Promise<void>;

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

  // Entrance Fee methods
  async getEntranceFees(filters?: {
    city?: string;
    siteName?: string;
    isActive?: boolean;
  }): Promise<EntranceFee[]> {
    let query = db.select().from(entranceFees);

    const conditions = [];
    if (filters?.city) {
      conditions.push(like(entranceFees.city, `%${filters.city}%`));
    }
    if (filters?.siteName) {
      conditions.push(like(entranceFees.site_name, `%${filters.siteName}%`));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(entranceFees.is_active, filters.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(entranceFees.city, entranceFees.site_name);
  }

  async getEntranceFee(id: string): Promise<EntranceFee | undefined> {
    const [entranceFee] = await db.select().from(entranceFees)
      .where(eq(entranceFees.id, id));
    return entranceFee || undefined;
  }

  async createEntranceFee(entranceFee: InsertEntranceFee): Promise<EntranceFee> {
    const [created] = await db.insert(entranceFees)
      .values(entranceFee)
      .returning();
    return created;
  }

  async updateEntranceFee(id: string, entranceFee: Partial<InsertEntranceFee>): Promise<EntranceFee | undefined> {
    const [updated] = await db.update(entranceFees)
      .set({ ...entranceFee, updated_at: new Date() })
      .where(eq(entranceFees.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEntranceFee(id: string): Promise<boolean> {
    const result = await db.update(entranceFees)
      .set({ is_active: false })
      .where(eq(entranceFees.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async bulkCreateEntranceFees(entranceFeesData: InsertEntranceFee[]): Promise<EntranceFee[]> {
    if (entranceFeesData.length === 0) return [];
    // Ensure the table exists before bulk insertion
    await this.ensureEntranceFeesTableExists();
    return await db.insert(entranceFees)
      .values(entranceFeesData)
      .returning();
  }

  async ensureEntranceFeesTableExists(): Promise<void> {
    try {
      // Try to query the table to check if it exists
      await db.select().from(entranceFees).limit(1);
    } catch (error: any) {
      if (error.code === '42P01') { // Table does not exist
        // Create the table using raw SQL
        await db.execute(`
          CREATE TABLE IF NOT EXISTS entrance_fees (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            city TEXT NOT NULL,
            site_name TEXT NOT NULL,
            net_pp INTEGER NOT NULL,
            price TEXT NOT NULL,
            unit_price REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('Created entrance_fees table');
      } else {
        throw error;
      }
    }
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