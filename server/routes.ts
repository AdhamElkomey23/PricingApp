import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { 
  insertServiceCategorySchema,
  insertServiceItemSchema,
  insertPricingRateSchema,
  insertTourSchema,
  insertTourVersionSchema,
  insertExcelUploadSchema
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
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
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
  // ========== Service Categories API ==========
  
  // Get all service categories
  app.get('/api/pricing/categories', asyncHandler(async (req: Request, res: Response) => {
    const categories = await storage.getServiceCategories();
    res.json(categories);
  }));
  
  // Get single service category
  app.get('/api/pricing/categories/:id', asyncHandler(async (req: Request, res: Response) => {
    const category = await storage.getServiceCategory(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Service category not found' });
    }
    res.json(category);
  }));
  
  // Create service category
  app.post('/api/pricing/categories', validateBody(insertServiceCategorySchema), asyncHandler(async (req: Request, res: Response) => {
    const category = await storage.createServiceCategory(req.body);
    res.status(201).json(category);
  }));
  
  // Update service category
  app.put('/api/pricing/categories/:id', validateBody(insertServiceCategorySchema.partial()), asyncHandler(async (req: Request, res: Response) => {
    const category = await storage.updateServiceCategory(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ error: 'Service category not found' });
    }
    res.json(category);
  }));
  
  // Delete service category (soft delete)
  app.delete('/api/pricing/categories/:id', asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteServiceCategory(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Service category not found' });
    }
    res.status(204).send();
  }));
  
  // ========== Service Items API ==========
  
  // Get all service items (optionally filtered by category)
  app.get('/api/pricing/services', asyncHandler(async (req: Request, res: Response) => {
    const categoryId = req.query.categoryId as string;
    const services = await storage.getServiceItems(categoryId);
    res.json(services);
  }));
  
  // Get single service item
  app.get('/api/pricing/services/:id', asyncHandler(async (req: Request, res: Response) => {
    const service = await storage.getServiceItem(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service item not found' });
    }
    res.json(service);
  }));
  
  // Create service item
  app.post('/api/pricing/services', validateBody(insertServiceItemSchema), asyncHandler(async (req: Request, res: Response) => {
    const service = await storage.createServiceItem(req.body);
    res.status(201).json(service);
  }));
  
  // Update service item
  app.put('/api/pricing/services/:id', validateBody(insertServiceItemSchema.partial()), asyncHandler(async (req: Request, res: Response) => {
    const service = await storage.updateServiceItem(req.params.id, req.body);
    if (!service) {
      return res.status(404).json({ error: 'Service item not found' });
    }
    res.json(service);
  }));
  
  // Delete service item (soft delete)
  app.delete('/api/pricing/services/:id', asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteServiceItem(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Service item not found' });
    }
    res.status(204).send();
  }));
  
  // ========== Pricing Rates API ==========
  
  // Get pricing rates with optional filters
  app.get('/api/pricing/rates', asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      serviceId: req.query.serviceId as string,
      currency: req.query.currency as string,
      profile: req.query.profile as string,
      effectiveDate: req.query.effectiveDate as string,
    };
    const rates = await storage.getPricingRates(filters);
    res.json(rates);
  }));
  
  // Get single pricing rate
  app.get('/api/pricing/rates/:id', asyncHandler(async (req: Request, res: Response) => {
    const rate = await storage.getPricingRate(req.params.id);
    if (!rate) {
      return res.status(404).json({ error: 'Pricing rate not found' });
    }
    res.json(rate);
  }));
  
  // Create pricing rate
  app.post('/api/pricing/rates', validateBody(insertPricingRateSchema), asyncHandler(async (req: Request, res: Response) => {
    const rate = await storage.createPricingRate(req.body);
    res.status(201).json(rate);
  }));
  
  // Update pricing rate
  app.put('/api/pricing/rates/:id', validateBody(insertPricingRateSchema.partial()), asyncHandler(async (req: Request, res: Response) => {
    const rate = await storage.updatePricingRate(req.params.id, req.body);
    if (!rate) {
      return res.status(404).json({ error: 'Pricing rate not found' });
    }
    res.json(rate);
  }));
  
  // Delete pricing rate (soft delete)
  app.delete('/api/pricing/rates/:id', asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deletePricingRate(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Pricing rate not found' });
    }
    res.status(204).send();
  }));
  
  // Bulk upsert pricing rates (for Excel import)
  app.post('/api/pricing/rates/bulk', asyncHandler(async (req: Request, res: Response) => {
    const ratesData = req.body.rates;
    if (!Array.isArray(ratesData)) {
      return res.status(400).json({ error: 'rates must be an array' });
    }
    
    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[]
    };
    
    for (const rateData of ratesData) {
      try {
        const validatedData = insertPricingRateSchema.parse(rateData);
        const rate = await storage.createPricingRate(validatedData);
        results.created++;
      } catch (error) {
        results.errors.push({ data: rateData, error: error.message });
      }
    }
    
    res.json(results);
  }));
  
  // ========== Tours API ==========
  
  // Get all tours with optional filters
  app.get('/api/tours', asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      status: req.query.status as string,
      createdBy: req.query.createdBy as string,
    };
    const tours = await storage.getTours(filters);
    res.json(tours);
  }));
  
  // Get single tour
  app.get('/api/tours/:id', asyncHandler(async (req: Request, res: Response) => {
    const tour = await storage.getTour(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.json(tour);
  }));
  
  // Create tour
  app.post('/api/tours', validateBody(insertTourSchema), asyncHandler(async (req: Request, res: Response) => {
    const tour = await storage.createTour(req.body);
    res.status(201).json(tour);
  }));
  
  // Update tour
  app.put('/api/tours/:id', validateBody(insertTourSchema.partial()), asyncHandler(async (req: Request, res: Response) => {
    const tour = await storage.updateTour(req.params.id, req.body);
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.json(tour);
  }));
  
  // Update tour name
  app.patch('/api/tours/:id/name', validateBody(z.object({ name: z.string().min(1) })), asyncHandler(async (req: Request, res: Response) => {
    const tour = await storage.updateTour(req.params.id, { name: req.body.name });
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.json(tour);
  }));
  
  // Delete tour
  app.delete('/api/tours/:id', asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteTour(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.status(204).send();
  }));
  
  // ========== Tour Versions API ==========
  
  // Get all versions for a tour
  app.get('/api/tours/:tourId/versions', asyncHandler(async (req: Request, res: Response) => {
    const versions = await storage.getTourVersions(req.params.tourId);
    res.json(versions);
  }));
  
  // Get latest version for a tour
  app.get('/api/tours/:tourId/versions/latest', asyncHandler(async (req: Request, res: Response) => {
    const version = await storage.getLatestTourVersion(req.params.tourId);
    if (!version) {
      return res.status(404).json({ error: 'No versions found for this tour' });
    }
    res.json(version);
  }));
  
  // Get single tour version
  app.get('/api/tours/:tourId/versions/:versionId', asyncHandler(async (req: Request, res: Response) => {
    const version = await storage.getTourVersion(req.params.versionId);
    if (!version || version.tour_id !== req.params.tourId) {
      return res.status(404).json({ error: 'Tour version not found' });
    }
    res.json(version);
  }));
  
  // Create new tour version
  app.post('/api/tours/:tourId/versions', validateBody(insertTourVersionSchema), asyncHandler(async (req: Request, res: Response) => {
    const versionData = { ...req.body, tour_id: req.params.tourId };
    const version = await storage.createTourVersion(versionData);
    res.status(201).json(version);
  }));
  
  // ========== Excel Uploads API ==========
  
  // Get all excel uploads
  app.get('/api/uploads', asyncHandler(async (req: Request, res: Response) => {
    const uploadedBy = req.query.uploadedBy as string;
    const uploads = await storage.getExcelUploads(uploadedBy);
    res.json(uploads);
  }));
  
  // Get single excel upload
  app.get('/api/uploads/:id', asyncHandler(async (req: Request, res: Response) => {
    const upload = await storage.getExcelUpload(req.params.id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    res.json(upload);
  }));
  
  // Upload Excel file
  app.post('/api/uploads', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const uploadData = {
      filename: req.file.filename,
      original_filename: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      status: 'pending' as const,
      uploaded_by: req.body.uploaded_by || null
    };
    
    const upload = await storage.createExcelUpload(uploadData);
    res.status(201).json(upload);
  }));
  
  // Update upload status (for processing)
  app.patch('/api/uploads/:id/status', validateBody(z.object({ 
    status: z.enum(['pending', 'processing', 'completed', 'failed']),
    error_log: z.string().optional(),
    records_processed: z.number().int().optional(),
    records_failed: z.number().int().optional()
  })), asyncHandler(async (req: Request, res: Response) => {
    const updateData = {
      ...req.body,
      processed_at: req.body.status === 'completed' || req.body.status === 'failed' 
        ? new Date().toISOString()
        : undefined
    };
    
    const upload = await storage.updateExcelUpload(req.params.id, updateData);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    res.json(upload);
  }));
  
  // Process uploaded Excel file
  app.post('/api/uploads/:id/process', asyncHandler(async (req: Request, res: Response) => {
    const upload = await storage.getExcelUpload(req.params.id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    
    if (upload.status !== 'pending') {
      return res.status(400).json({ error: 'Upload has already been processed' });
    }
    
    // Update status to processing
    await storage.updateExcelUpload(req.params.id, { status: 'processing' });
    
    try {
      // TODO: Implement actual Excel processing logic here
      // For now, just simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await storage.updateExcelUpload(req.params.id, {
        status: 'completed',
        processed_at: new Date().toISOString(),
        records_processed: 100, // Mock value
        records_failed: 0
      });
      
      res.json({ message: 'Processing completed successfully' });
    } catch (error) {
      await storage.updateExcelUpload(req.params.id, {
        status: 'failed',
        processed_at: new Date().toISOString(),
        error_log: error.message
      });
      
      res.status(500).json({ error: 'Processing failed', message: error.message });
    }
  }));
  
  // Delete upload and associated file
  app.delete('/api/uploads/:id', asyncHandler(async (req: Request, res: Response) => {
    const upload = await storage.getExcelUpload(req.params.id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    
    // Delete the file from disk
    try {
      await fs.unlink(upload.file_path);
    } catch (error) {
      console.warn('Failed to delete file:', upload.file_path, error);
    }
    
    const success = await storage.deleteExcelUpload(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Upload not found' });
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
