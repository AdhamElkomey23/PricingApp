
import OpenAI from "openai";
import { storage } from "./storage";
import type { ParsedItinerary, DailyBreakdown, Service } from "@shared/schema";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured. The AI itinerary parser requires an OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

interface ServiceMatch {
  service: Service;
  confidence: number;
  dbMatch?: any;
  priceFound: boolean;
  missingInfo?: string;
}

interface AnalysisResult {
  parsedItinerary: ParsedItinerary;
  priceMatches: ServiceMatch[];
  missingPrices: string[];
  recommendations: string[];
}

export class AIItineraryParser {
  async analyzeItinerary(itineraryText: string, numPeople: number, numDays: number): Promise<AnalysisResult> {
    try {
      // Step 1: Parse the itinerary text into structured data
      const parsedItinerary = await this.parseItineraryStructure(itineraryText, numPeople, numDays);
      
      // Step 2: Analyze and match services with database prices
      const serviceAnalysis = await this.analyzeAndMatchServices(parsedItinerary);
      
      // Step 3: Generate recommendations for missing data
      const recommendations = await this.generateRecommendations(serviceAnalysis.missingPrices);
      
      return {
        parsedItinerary,
        priceMatches: serviceAnalysis.matches,
        missingPrices: serviceAnalysis.missingPrices,
        recommendations
      };
    } catch (error) {
      console.error("Error analyzing itinerary:", error);
      throw new Error(`Failed to analyze itinerary: ${error.message}`);
    }
  }

  private async parseItineraryStructure(itineraryText: string, numPeople: number, numDays: number): Promise<ParsedItinerary> {
    const systemPrompt = `You are an expert travel itinerary analyst specializing in Egypt tours. Your task is to parse free-text itineraries into structured data.

IMPORTANT INSTRUCTIONS:
1. Identify each day and extract all services
2. Categorize services into:
   - Transportation (cars, trains, flights, boats, transfers)
   - Guides & Personnel (tour guides, drivers, representatives)
   - Entrance Fees (museums, sites, attractions)
   - Accommodation (hotels, cruises, camps)
   - Meals (breakfast, lunch, dinner)
   - Optional Services (tips, shopping, extras)

3. For each service, determine:
   - Service name (be specific)
   - Service category
   - Cost basis (per_person, per_group, per_night, per_day, flat_rate)
   - Quantity needed
   - Location/city
   - Any special requirements

4. Detect cities and regions accurately (Cairo, Alexandria, Luxor, Aswan, Hurghada, Sharm El Sheikh, etc.)

5. Return valid JSON only.`;

    const userPrompt = `Analyze this Egypt itinerary for ${numPeople} people over ${numDays} days:

${itineraryText}

Return a JSON object with this exact structure:
{
  "overview": {
    "num_days": ${numDays},
    "num_people": ${numPeople},
    "cities_detected": ["City1", "City2"],
    "ground_handler_fees": {}
  },
  "days": [
    {
      "day": 1,
      "label": "Day description",
      "city_or_region": "City name",
      "activities_detected": ["activity1", "activity2"],
      "per_group": [
        {
          "service": "Specific service name",
          "reason": "Why this service is needed",
          "quantity": 1,
          "included": true,
          "category": "transportation|guide|entrance|accommodation|meal|optional",
          "cost_basis": "per_group",
          "location": "City name",
          "requirements": "Special requirements if any"
        }
      ],
      "per_person": [
        {
          "service": "Specific service name",
          "reason": "Why this service is needed",
          "quantity": 1,
          "included": true,
          "category": "transportation|guide|entrance|accommodation|meal|optional",
          "cost_basis": "per_person",
          "location": "City name",
          "requirements": "Special requirements if any"
        }
      ]
    }
  ],
  "assumptions": ["assumption1", "assumption2"],
  "missing_info": ["missing1", "missing2"]
}`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return parsed as ParsedItinerary;
  }

  private async analyzeAndMatchServices(itinerary: ParsedItinerary): Promise<{
    matches: ServiceMatch[];
    missingPrices: string[];
  }> {
    const allServices: Service[] = [];
    const matches: ServiceMatch[] = [];
    const missingPrices: string[] = [];

    // Collect all services from all days
    for (const day of itinerary.days) {
      allServices.push(...day.per_group.map(s => ({ ...s, day: day.day, isPerGroup: true })));
      allServices.push(...day.per_person.map(s => ({ ...s, day: day.day, isPerGroup: false })));
    }

    // Get all available prices from database
    const dbPrices = await storage.getPrices({ isActive: true });

    for (const service of allServices) {
      const match = await this.findBestPriceMatch(service, dbPrices);
      
      if (match.priceFound) {
        // Update service with found price
        service.unitPrice = match.dbMatch.unit_price;
        matches.push(match);
      } else {
        missingPrices.push(`${service.service} in ${service.location || 'unknown location'} - ${match.missingInfo}`);
        matches.push(match);
      }
    }

    // Update the itinerary with matched prices
    this.updateItineraryWithPrices(itinerary, matches);

    return { matches, missingPrices };
  }

  private async findBestPriceMatch(service: any, dbPrices: any[]): Promise<ServiceMatch> {
    // Use AI to find the best matching price from database
    const systemPrompt = `You are a pricing database expert. Your task is to find the best matching price for a travel service from available database entries.

Consider:
1. Service name similarity
2. Category match
3. Location match
4. Cost basis compatibility
5. Service requirements

Return confidence score 0-100 and explain any missing information.`;

    const userPrompt = `Find the best price match for this service:
Service: ${service.service}
Category: ${service.category || 'unknown'}
Location: ${service.location || 'unknown'}
Cost Basis: ${service.cost_basis}
Requirements: ${service.requirements || 'none'}

Available prices:
${JSON.stringify(dbPrices.slice(0, 20), null, 2)}

Return JSON: {
  "bestMatch": { price object or null },
  "confidence": 0-100,
  "priceFound": boolean,
  "missingInfo": "what's missing if no match found"
}`;

    try {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");

      return {
        service,
        confidence: analysis.confidence || 0,
        dbMatch: analysis.bestMatch,
        priceFound: analysis.priceFound || false,
        missingInfo: analysis.missingInfo || "No matching price found"
      };
    } catch (error) {
      return {
        service,
        confidence: 0,
        priceFound: false,
        missingInfo: "Error matching prices"
      };
    }
  }

  private updateItineraryWithPrices(itinerary: ParsedItinerary, matches: ServiceMatch[]) {
    for (const day of itinerary.days) {
      // Update per_group services
      for (let i = 0; i < day.per_group.length; i++) {
        const match = matches.find(m => 
          m.service.day === day.day && 
          m.service.service === day.per_group[i].service &&
          m.service.isPerGroup
        );
        if (match && match.priceFound) {
          day.per_group[i].unitPrice = match.dbMatch.unit_price;
        }
      }

      // Update per_person services
      for (let i = 0; i < day.per_person.length; i++) {
        const match = matches.find(m => 
          m.service.day === day.day && 
          m.service.service === day.per_person[i].service &&
          !m.service.isPerGroup
        );
        if (match && match.priceFound) {
          day.per_person[i].unitPrice = match.dbMatch.unit_price;
        }
      }
    }
  }

  private async generateRecommendations(missingPrices: string[]): Promise<string[]> {
    if (missingPrices.length === 0) return [];

    const systemPrompt = `You are a travel pricing expert. Generate actionable recommendations for missing price data.

For each missing price, suggest:
1. How to find similar services in the database
2. What additional information might be needed
3. Potential alternatives or substitutions
4. Pricing estimation strategies`;

    const userPrompt = `Generate recommendations for these missing prices:
${missingPrices.join('\n')}

Return JSON array of recommendation strings.`;

    try {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.recommendations || [];
    } catch (error) {
      return ["Unable to generate recommendations for missing prices"];
    }
  }
}

export const aiParser = new AIItineraryParser();
