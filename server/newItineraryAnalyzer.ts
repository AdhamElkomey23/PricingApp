import OpenAI from "openai";
import { storage } from "./storage";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Service categories for clear organization
export type ServiceCategory = 
  | "transportation" 
  | "guide_personnel" 
  | "entrance_fees" 
  | "accommodation" 
  | "meals" 
  | "optional_extras"
  | "other";

export interface DetectedService {
  day: number;
  category: ServiceCategory;
  description: string;
  quantity: number;
  cost_basis: "per_person" | "per_group" | "per_night" | "per_day" | "flat_rate";
  location?: string;
  notes?: string;
}

export interface PriceMatch {
  service: DetectedService;
  matched: boolean;
  price?: number;
  currency?: string;
  confidence?: number;
  database_match?: any;
  hint?: string;
}

export interface AnalysisResult {
  summary: {
    total_days: number;
    total_people: number;
    cities: string[];
    total_services: number;
    services_with_prices: number;
    services_without_prices: number;
  };
  services_by_day: {
    day: number;
    label: string;
    location: string;
    services: PriceMatch[];
  }[];
  pricing: {
    per_person_total: number;
    per_group_total: number;
    currency: string;
    breakdown_by_category: {
      category: ServiceCategory;
      total: number;
      count: number;
    }[];
  };
  missing_prices: {
    category: ServiceCategory;
    description: string;
    hint: string;
  }[];
  recommendations: string[];
}

export class NewItineraryAnalyzer {
  
  /**
   * Main entry point: Analyze a complete itinerary and match prices
   */
  async analyzeItinerary(
    itineraryText: string, 
    numPeople: number, 
    numDays: number
  ): Promise<AnalysisResult> {
    try {
      // Step 1: Extract structured services from itinerary text
      const detectedServices = await this.extractServices(itineraryText, numDays, numPeople);
      
      // Step 2: Match each service with database prices
      const priceMatches = await this.matchPrices(detectedServices);
      
      // Step 3: Calculate totals and generate recommendations
      const analysis = this.compileAnalysis(priceMatches, numPeople, numDays);
      
      return analysis;
      
    } catch (error: any) {
      console.error("Itinerary analysis error:", error);
      throw new Error(`Failed to analyze itinerary: ${error.message}`);
    }
  }

  /**
   * Step 1: Use AI to extract all services from free-text itinerary
   */
  private async extractServices(
    itineraryText: string, 
    numDays: number,
    numPeople: number
  ): Promise<DetectedService[]> {
    
    const systemPrompt = `You are an expert travel operations analyst. Extract ALL services from this Egypt tour itinerary.

For EACH service identified, categorize it precisely:

**TRANSPORTATION** - Any vehicle, transfer, flight, train, boat
  Examples: "Airport transfer", "Day tour car", "Train Cairo-Luxor", "Nile cruise", "Flight"
  
**GUIDE_PERSONNEL** - Tour guides, drivers, representatives, assistants
  Examples: "Tour guide", "English-speaking guide", "Driver", "Meet & assist representative"
  
**ENTRANCE_FEES** - Tickets to sites, museums, attractions
  Examples: "Pyramids entrance", "Egyptian Museum ticket", "Valley of Kings", "Abu Simbel"
  
**ACCOMMODATION** - Hotels, resorts, cruise ships
  Examples: "Hotel in Cairo", "Nile cruise cabin", "Resort stay"
  
**MEALS** - Breakfast, lunch, dinner
  Examples: "Lunch at local restaurant", "Dinner on cruise", "Hotel breakfast"
  
**OPTIONAL_EXTRAS** - Sound & light shows, optional tours, special activities
  Examples: "Pyramids sound & light show", "Hot air balloon", "Felucca ride"

For each service, determine:
- **cost_basis**: "per_person" (tickets, meals), "per_group" (cars, private guides), "per_night" (hotels), "per_day" (full day tours), or "flat_rate" (one-time fees)
- **quantity**: Number of units (e.g., 1 car, 2 nights, 1 entrance ticket per person)
- **location**: City/region (Cairo, Alexandria, Luxor, Aswan, etc.)

Be thorough - don't miss any service. Extract from context when explicit details are missing.

Return JSON object with services array:
{
  "services": [
    {
      "day": 1,
      "category": "transportation",
      "description": "Airport pickup - Cairo International Airport",
      "quantity": 1,
      "cost_basis": "per_group",
      "location": "Cairo",
      "notes": "Private transfer"
    }
  ]
}`;

    const userPrompt = `Itinerary for ${numPeople} people over ${numDays} days:

${itineraryText}

Extract ALL services following the categorization guidelines.`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Handle both array and object responses for robustness
    let services: DetectedService[] = [];
    if (Array.isArray(result)) {
      services = result;
    } else if (result.services && Array.isArray(result.services)) {
      services = result.services;
    } else {
      console.warn("Unexpected AI response format:", result);
      throw new Error("AI returned unexpected format. Please try again.");
    }
    
    // Validate we got services
    if (services.length === 0) {
      throw new Error("No services detected in itinerary. Please provide a more detailed itinerary with specific services, locations, and activities.");
    }
    
    console.log(`Extracted ${services.length} services from itinerary`);
    return services;
  }

  /**
   * Step 2: Match detected services with database prices using fuzzy matching
   */
  private async matchPrices(services: DetectedService[]): Promise<PriceMatch[]> {
    // Get all active prices from database
    const allPrices = await storage.getPrices({ isActive: true });
    
    const matches: PriceMatch[] = [];

    for (const service of services) {
      const searchTerms = [
        service.description.toLowerCase(),
        service.category,
        service.location
      ].filter(Boolean) as string[];

      // Find best matching price in database
      let bestMatch: any = null;
      let bestScore = 0;

      for (const dbPrice of allPrices) {
        let score = 0;
        const maxScore = 100; // Normalize to 100 points
        
        const dbText = [
          dbPrice.service_name,
          dbPrice.category,
          dbPrice.route_name,
          dbPrice.location,
          dbPrice.vehicle_type
        ].filter(Boolean).join(' ').toLowerCase();

        // Calculate match score (out of 100 points)
        // Text matching: up to 30 points
        let textMatches = 0;
        for (const term of searchTerms) {
          if (dbText.includes(term.toLowerCase())) {
            textMatches++;
          }
        }
        score += Math.min(30, textMatches * 10); // 10 points per match, max 30

        // Category match: 40 points (most important)
        if (this.categoryMatches(service.category, dbPrice.category)) {
          score += 40;
        }

        // Location match: 20 points
        if (service.location && dbPrice.location && 
            dbPrice.location.toLowerCase().includes(service.location.toLowerCase())) {
          score += 20;
        }

        // Cost basis match: 10 points
        if (service.cost_basis === dbPrice.cost_basis) {
          score += 10;
        }

        // Normalize to ensure max 100
        score = Math.min(score, maxScore);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = dbPrice;
        }
      }

      // Consider it a match if confidence >= 60%
      const matched = bestScore >= 60;
      
      if (matched && bestMatch) {
        matches.push({
          service,
          matched: true,
          price: bestMatch.unit_price,
          currency: bestMatch.currency,
          confidence: bestScore,
          database_match: bestMatch
        });
      } else {
        // No match found - provide helpful hint
        const hint = this.generateMissingPriceHint(service);
        matches.push({
          service,
          matched: false,
          hint
        });
      }
    }

    return matches;
  }

  /**
   * Helper: Check if service category matches database category
   */
  private categoryMatches(serviceCategory: ServiceCategory, dbCategory: string | null): boolean {
    if (!dbCategory) return false;
    
    const categoryMap: Record<ServiceCategory, string[]> = {
      transportation: ['transport', 'transfer', 'car', 'vehicle', 'train', 'flight', 'boat'],
      guide_personnel: ['guide', 'driver', 'personnel', 'assistant', 'representative'],
      entrance_fees: ['entrance', 'ticket', 'admission', 'fee', 'site'],
      accommodation: ['hotel', 'accommodation', 'resort', 'cruise', 'stay'],
      meals: ['meal', 'lunch', 'dinner', 'breakfast', 'food'],
      optional_extras: ['optional', 'extra', 'show', 'activity', 'special'],
      other: []
    };

    const keywords = categoryMap[serviceCategory] || [];
    const dbCat = dbCategory.toLowerCase();
    
    return keywords.some(keyword => dbCat.includes(keyword));
  }

  /**
   * Helper: Generate helpful hint for missing prices
   */
  private generateMissingPriceHint(service: DetectedService): string {
    const category = service.category;
    const location = service.location || 'unknown location';
    
    const hints: Record<ServiceCategory, string> = {
      transportation: `Add a price for: "${service.description}" in ${location}. Specify vehicle type and passenger capacity if applicable.`,
      guide_personnel: `Add a price for: "${service.description}" in ${location}. Specify if it's per day or per tour.`,
      entrance_fees: `Add a price for: "${service.description}" entrance ticket. Usually priced per person.`,
      accommodation: `Add a price for: "${service.description}" in ${location}. Specify per night rate and room type.`,
      meals: `Add a price for: "${service.description}". Usually priced per person.`,
      optional_extras: `Add a price for: "${service.description}" optional activity.`,
      other: `Add a price for: "${service.description}" in your database.`
    };

    return hints[category] || `Add pricing data for "${service.description}"`;
  }

  /**
   * Step 3: Compile final analysis with totals and recommendations
   */
  private compileAnalysis(matches: PriceMatch[], numPeople: number, numDays: number): AnalysisResult {
    const servicesWithPrices = matches.filter(m => m.matched);
    const servicesWithoutPrices = matches.filter(m => !m.matched);
    
    // Group by day
    const servicesByDay: Map<number, PriceMatch[]> = new Map();
    for (const match of matches) {
      const day = match.service.day;
      if (!servicesByDay.has(day)) {
        servicesByDay.set(day, []);
      }
      servicesByDay.get(day)!.push(match);
    }

    // Calculate totals
    let perPersonTotal = 0;
    let perGroupTotal = 0;
    const currency = servicesWithPrices[0]?.currency || "EUR";

    const categoryTotals: Map<ServiceCategory, { total: number; count: number }> = new Map();

    for (const match of servicesWithPrices) {
      if (!match.price) continue;

      const service = match.service;
      const price = match.price;
      const quantity = service.quantity;

      let serviceTotal = 0;

      switch (service.cost_basis) {
        case "per_person":
          serviceTotal = price * quantity * numPeople;
          perPersonTotal += price * quantity;
          break;
        case "per_group":
        case "flat_rate":
          serviceTotal = price * quantity;
          perGroupTotal += price * quantity;
          break;
        case "per_night":
        case "per_day":
          serviceTotal = price * quantity;
          perGroupTotal += price * quantity;
          break;
      }

      // Track by category
      const category = service.category;
      if (!categoryTotals.has(category)) {
        categoryTotals.set(category, { total: 0, count: 0 });
      }
      const catData = categoryTotals.get(category)!;
      catData.total += serviceTotal;
      catData.count += 1;
    }

    // Extract unique cities
    const cities = Array.from(new Set(matches.map(m => m.service.location).filter(Boolean))) as string[];

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (servicesWithoutPrices.length > 0) {
      recommendations.push(`${servicesWithoutPrices.length} services need pricing data. Review the missing prices section for details.`);
    }
    
    if (servicesWithPrices.length > 0) {
      recommendations.push(`${servicesWithPrices.length} services successfully matched with database prices.`);
    }

    const completionRate = (servicesWithPrices.length / matches.length) * 100;
    if (completionRate < 80) {
      recommendations.push(`Current pricing completion: ${completionRate.toFixed(0)}%. Add missing prices to improve accuracy.`);
    }

    // Build services by day structure
    const servicesByDayArray = Array.from(servicesByDay.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, services]) => {
        const firstService = services[0];
        return {
          day,
          label: `Day ${day}`,
          location: firstService?.service.location || "Various locations",
          services
        };
      });

    return {
      summary: {
        total_days: numDays,
        total_people: numPeople,
        cities,
        total_services: matches.length,
        services_with_prices: servicesWithPrices.length,
        services_without_prices: servicesWithoutPrices.length
      },
      services_by_day: servicesByDayArray,
      pricing: {
        per_person_total: perPersonTotal,
        per_group_total: perGroupTotal + (perPersonTotal * numPeople),
        currency,
        breakdown_by_category: Array.from(categoryTotals.entries()).map(([category, data]) => ({
          category,
          total: data.total,
          count: data.count
        }))
      },
      missing_prices: servicesWithoutPrices.map(m => ({
        category: m.service.category,
        description: m.service.description,
        hint: m.hint || "Add this service to your pricing database"
      })),
      recommendations
    };
  }
}

// Export singleton instance
export const newAnalyzer = new NewItineraryAnalyzer();
