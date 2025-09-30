import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { parse } from 'csv-parse/sync';
import { storage } from "./storage";
import { 
  insertPriceSchema,
  insertCsvUploadSchema,
  csvRowSchema,
  type CsvRow
} from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueName = `${randomUUID()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function for error handling
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    });
  };
};

// Validation middleware
const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      } else {
        res.status(400).json({ 
          error: 'Invalid request body' 
        });
      }
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== Prices API ==========

  // Get all prices with optional filters
  app.get('/api/prices', asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      serviceName: req.query.serviceName as string,
      category: req.query.category as string,
      currency: req.query.currency as string,
      location: req.query.location as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    };
    const pricesList = await storage.getPrices(filters);
    res.json(pricesList);
  }));

  // Get single price
  app.get('/api/prices/:id', asyncHandler(async (req: Request, res: Response) => {
    const price = await storage.getPrice(req.params.id);
    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }
    res.json(price);
  }));

  // Create price
  app.post('/api/prices', validateBody(insertPriceSchema), asyncHandler(async (req: Request, res: Response) => {
    const price = await storage.createPrice(req.body);
    res.status(201).json(price);
  }));

  // Update price
  app.put('/api/prices/:id', validateBody(insertPriceSchema.partial()), asyncHandler(async (req: Request, res: Response) => {
    const price = await storage.updatePrice(req.params.id, req.body);
    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }
    res.json(price);
  }));

  // Delete price (soft delete)
  app.delete('/api/prices/:id', asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deletePrice(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Price not found' });
    }
    res.status(204).send();
  }));

  // Bulk create prices
  app.post('/api/prices/bulk', validateBody(z.object({ prices: z.array(insertPriceSchema) })), asyncHandler(async (req: Request, res: Response) => {
    const created = await storage.bulkCreatePrices(req.body.prices);
    res.status(201).json({ 
      message: `Successfully created ${created.length} prices`,
      prices: created
    });
  }));

  // ========== CSV Uploads API ==========

  // Get all CSV uploads
  app.get('/api/csv-uploads', asyncHandler(async (req: Request, res: Response) => {
    const uploadedBy = req.query.uploadedBy as string;
    const uploads = await storage.getCsvUploads(uploadedBy);
    res.json(uploads);
  }));

  // Get single CSV upload
  app.get('/api/csv-uploads/:id', asyncHandler(async (req: Request, res: Response) => {
    const upload = await storage.getCsvUpload(req.params.id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    res.json(upload);
  }));

  // Upload CSV file
  app.post('/api/csv-uploads', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const city = req.body.city;
    
    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    const uploadData = {
      filename: req.file.filename,
      original_filename: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      city: city,
      status: 'pending' as const,
      uploaded_by: req.body.uploaded_by || null
    };

    const csvUpload = await storage.createCsvUpload(uploadData);
    res.status(201).json(csvUpload);
  }));

  // Process uploaded CSV file
  app.post('/api/csv-uploads/:id/process', asyncHandler(async (req: Request, res: Response) => {
    const upload = await storage.getCsvUpload(req.params.id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    if (upload.status !== 'pending') {
      return res.status(400).json({ error: 'Upload has already been processed or is currently processing' });
    }

    // Update status to processing
    await storage.updateCsvUpload(req.params.id, { status: 'processing' });

    try {
      const fileContent = await fs.readFile(upload.file_path, 'utf-8');
      let recordsProcessed = 0;
      let recordsFailed = 0;
      const errors: Array<{row: number, data: any, error: string}> = [];

      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true
      });

      const pricesToCreate: any[] = [];

      // Process each record
      for (let i = 0; i < records.length; i++) {
        const record = records[i] as any;
        try {
          // Normalize column names (trim spaces)
          const normalizedRecord: any = {};
          for (const [key, value] of Object.entries(record)) {
            normalizedRecord[key.trim()] = value;
          }

          // Map CSV columns to expected schema
          const mappedRecord = {
            service_name: normalizedRecord['Service Name'],
            category: normalizedRecord['Category'],
            route_name: normalizedRecord['Route Name'],
            cost_basis: normalizedRecord['Cost Basis'],
            unit: normalizedRecord['Unit'],
            base_cost: normalizedRecord['Base Cost'],
            notes: normalizedRecord['Notes'],
            vehicle_type: normalizedRecord['Vehicle Type'],
            passenger_capacity: normalizedRecord['Passenger Capacity']
          };

          // Validate CSV row
          const validatedRow = csvRowSchema.parse(mappedRecord);
          
          // Parse base_cost to extract unit_price and currency
          // Format: "20 €" or "96 €" or "." (missing)
          let unitPrice = 0;
          let currency = 'EUR';
          
          const baseCostStr = validatedRow.base_cost.trim();
          if (baseCostStr && baseCostStr !== '.') {
            // Remove currency symbols and parse number
            const priceMatch = baseCostStr.match(/([0-9.]+)\s*([€$])/);
            if (priceMatch) {
              unitPrice = parseFloat(priceMatch[1]);
              currency = priceMatch[2] === '€' ? 'EUR' : 'USD';
            } else {
              // Try to parse as plain number
              const parsed = parseFloat(baseCostStr);
              if (!isNaN(parsed)) {
                unitPrice = parsed;
              }
            }
          }

          // Use city from upload record as location
          // This ensures all prices from this CSV are tagged with the assigned city
          const location = upload.city;

          pricesToCreate.push({
            service_name: validatedRow.service_name,
            category: validatedRow.category || null,
            route_name: validatedRow.route_name || null,
            cost_basis: validatedRow.cost_basis,
            unit: validatedRow.unit || null,
            unit_price: unitPrice,
            currency: currency,
            notes: validatedRow.notes || null,
            vehicle_type: validatedRow.vehicle_type || null,
            passenger_capacity: validatedRow.passenger_capacity || null,
            location: location,
            is_active: true
          });
          
          recordsProcessed++;
        } catch (error: any) {
          recordsFailed++;
          const errorMessage = error instanceof z.ZodError 
            ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
            : error?.message || 'Unknown error';
          errors.push({ 
            row: i + 2, // +2 because row 1 is headers and arrays are 0-indexed
            data: record, 
            error: errorMessage 
          });
        }
      }

      // Bulk insert valid prices
      if (pricesToCreate.length > 0) {
        await storage.bulkCreatePrices(pricesToCreate);
      }

      // Update upload status
      await storage.updateCsvUpload(req.params.id, {
        status: 'completed',
        processed_at: new Date() as any,
        records_processed: recordsProcessed,
        records_failed: recordsFailed,
        error_log: errors.length > 0 ? JSON.stringify(errors, null, 2) : null
      });

      res.json({ 
        message: 'Processing completed',
        recordsProcessed,
        recordsFailed,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      await storage.updateCsvUpload(req.params.id, {
        status: 'failed',
        processed_at: new Date() as any,
        error_log: error?.message || 'Unknown error'
      });

      res.status(500).json({ error: 'Processing failed', message: error?.message || 'Unknown error' });
    }
  }));

  // Delete CSV upload and associated file
  app.delete('/api/csv-uploads/:id', asyncHandler(async (req: Request, res: Response) => {
    const upload = await storage.getCsvUpload(req.params.id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Delete the file from disk
    try {
      await fs.unlink(upload.file_path);
    } catch (error) {
      console.warn('Failed to delete file:', upload.file_path, error);
    }

    const success = await storage.deleteCsvUpload(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.status(204).send();
  }));

  // ========== Quotations API ==========

  // Get all quotations
  app.get('/api/quotations', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const quotationsList = await storage.getQuotations(userId);
    res.json(quotationsList);
  }));

  // Get single quotation
  app.get('/api/quotations/:id', asyncHandler(async (req: Request, res: Response) => {
    const quotation = await storage.getQuotation(req.params.id);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.json(quotation);
  }));

  // Create quotation
  app.post('/api/quotations', asyncHandler(async (req: Request, res: Response) => {
    const quotation = await storage.createQuotation(req.body);
    res.status(201).json(quotation);
  }));

  // Update quotation
  app.put('/api/quotations/:id', asyncHandler(async (req: Request, res: Response) => {
    const quotation = await storage.updateQuotation(req.params.id, req.body);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.json(quotation);
  }));

  // Delete quotation
  app.delete('/api/quotations/:id', asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteQuotation(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.status(204).send();
  }));

  // ========== Health Check ==========
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
