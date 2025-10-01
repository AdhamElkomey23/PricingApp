import OpenAI from "openai";
import { storage } from "./storage";
import type { InsertPrice } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured. The chatbot feature requires an OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface DatabaseAction {
  action: "search" | "create" | "update" | "delete" | "info";
  parameters?: any;
}

export async function processUserQuery(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<{
  reply: string;
  data?: any;
}> {
  try {
    // Step 1: Determine what action the user wants
    const actionResponse = await getOpenAI().chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a database assistant for an Egypt travel pricing system. Analyze the user's request and determine what database action they want.

Available actions:
- "search": Search for prices (e.g., "show me all prices", "find Alexandria prices", "what's the cost of transfers")
- "create": Add new pricing data (e.g., "add a new service", "create a price for...")
- "update": Modify existing prices (e.g., "update the price of...", "change...")
- "delete": Remove prices (e.g., "delete...", "remove...")
- "info": General questions about the database (e.g., "how many prices", "what categories exist")

Respond with JSON in this format:
{
  "action": "search|create|update|delete|info",
  "parameters": {
    "query": "search term or question",
    "service_name": "name if creating/updating",
    "category": "category if applicable",
    "location": "location if applicable",
    "price": number,
    "cost_basis": "per_person|per_group|per_night|per_day|flat_rate"
  }
}`,
        },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const actionData: DatabaseAction = JSON.parse(actionResponse.choices[0].message.content || "{}");

    // Step 2: Execute the database action
    let dbResult: any = null;
    let actionSummary = "";

    switch (actionData.action) {
      case "search":
        dbResult = await searchPrices(actionData.parameters);
        actionSummary = `Found ${dbResult.length} results`;
        break;

      case "create":
        dbResult = await createPrice(actionData.parameters);
        actionSummary = `Created new price entry`;
        break;

      case "update":
        dbResult = await updatePrice(actionData.parameters);
        actionSummary = `Updated price information`;
        break;

      case "delete":
        dbResult = await deletePrice(actionData.parameters);
        actionSummary = `Deleted price entry`;
        break;

      case "info":
        dbResult = await getDatabaseInfo(actionData.parameters);
        actionSummary = `Retrieved database information`;
        break;

      default:
        actionSummary = "I'm not sure what you want me to do";
    }

    // Step 3: Generate a natural language response
    const responseMessages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a helpful AI assistant for managing Egypt travel pricing data. 
You help users create, update, search, and delete pricing information in a friendly, conversational way.

Database action performed: ${actionData.action}
Result summary: ${actionSummary}
Data: ${JSON.stringify(dbResult, null, 2)}

Generate a natural, friendly response that:
1. Confirms what action was taken
2. Presents the data in an easy-to-read format
3. Offers to help with related tasks

Be concise but helpful. If there are multiple results, summarize them clearly.`,
      },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const finalResponse = await getOpenAI().chat.completions.create({
      model: "gpt-5",
      messages: responseMessages,
    });

    return {
      reply: finalResponse.choices[0].message.content || "I processed your request.",
      data: dbResult,
    };
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return {
      reply: `I encountered an error: ${error.message}. Could you rephrase your request?`,
      data: null,
    };
  }
}

// Database helper functions
async function searchPrices(params: any) {
  const query = params?.query?.toLowerCase() || "";
  
  if (!query) {
    // Return all active prices
    const allPrices = await storage.getPrices({ isActive: true });
    return allPrices.slice(0, 50);
  }

  // Search by service name, category, or location
  const allPrices = await storage.getPrices({ isActive: true });
  const results = allPrices.filter(price => {
    const searchableText = [
      price.service_name,
      price.category,
      price.location,
      price.route_name
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchableText.includes(query);
  });

  return results.slice(0, 50);
}

async function createPrice(params: any) {
  if (!params?.service_name || !params?.price || !params?.cost_basis) {
    throw new Error("Missing required fields: service_name, price, and cost_basis are required");
  }

  const priceData: InsertPrice = {
    service_name: params.service_name,
    category: params.category || null,
    route_name: params.route_name || null,
    cost_basis: params.cost_basis,
    unit: params.unit || null,
    unit_price: parseFloat(params.price),
    currency: params.currency || "EUR",
    notes: params.notes || null,
    vehicle_type: params.vehicle_type || null,
    passenger_capacity: params.passenger_capacity || null,
    location: params.location || null,
    is_active: true,
  };

  return await storage.createPrice(priceData);
}

async function updatePrice(params: any) {
  if (!params?.id && !params?.service_name) {
    throw new Error("Need either an ID or service name to update");
  }

  const updateData: Partial<InsertPrice> = {};
  if (params.price !== undefined) updateData.unit_price = parseFloat(params.price);
  if (params.category !== undefined) updateData.category = params.category;
  if (params.location !== undefined) updateData.location = params.location;
  if (params.cost_basis !== undefined) updateData.cost_basis = params.cost_basis;
  if (params.notes !== undefined) updateData.notes = params.notes;

  if (params.id) {
    // Update by ID
    return await storage.updatePrice(params.id, updateData);
  } else {
    // Find by service name and update first match
    const allPrices = await storage.getPrices({ isActive: true });
    const match = allPrices.find(p => 
      p.service_name.toLowerCase().includes(params.service_name.toLowerCase())
    );
    
    if (!match) {
      throw new Error(`No price found matching: ${params.service_name}`);
    }
    
    return await storage.updatePrice(match.id, updateData);
  }
}

async function deletePrice(params: any) {
  if (!params?.id && !params?.service_name) {
    throw new Error("Need either an ID or service name to delete");
  }

  if (params.id) {
    // Delete by ID
    const success = await storage.deletePrice(params.id);
    return success ? { deleted: true, id: params.id } : null;
  } else {
    // Find by service name and delete first match
    const allPrices = await storage.getPrices({ isActive: true });
    const match = allPrices.find(p => 
      p.service_name.toLowerCase().includes(params.service_name.toLowerCase())
    );
    
    if (!match) {
      throw new Error(`No price found matching: ${params.service_name}`);
    }
    
    const success = await storage.deletePrice(match.id);
    return success ? { deleted: true, id: match.id, service_name: match.service_name } : null;
  }
}

async function getDatabaseInfo(params: any) {
  const query = params?.query?.toLowerCase() || "";
  const allPrices = await storage.getPrices({ isActive: true });

  if (query.includes("count") || query.includes("how many")) {
    return { total_prices: allPrices.length };
  }

  if (query.includes("categories") || query.includes("category")) {
    const categories = Array.from(new Set(allPrices.map(p => p.category).filter(Boolean)));
    return { categories };
  }

  if (query.includes("locations") || query.includes("location") || query.includes("cities")) {
    const locations = Array.from(new Set(allPrices.map(p => p.location).filter(Boolean)));
    return { locations };
  }

  // General stats
  const categories = Array.from(new Set(allPrices.map(p => p.category).filter(Boolean)));
  const locations = Array.from(new Set(allPrices.map(p => p.location).filter(Boolean)));

  return {
    total_prices: allPrices.length,
    unique_categories: categories.length,
    unique_locations: locations.length,
    categories,
    locations,
  };
}
