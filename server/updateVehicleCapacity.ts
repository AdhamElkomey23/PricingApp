
import { db } from "./db";
import { prices } from "@shared/schema";
import { eq, or } from "drizzle-orm";

async function updateVehicleCapacities() {
  try {
    console.log("Starting vehicle capacity updates...");

    // Update Coaster vehicles from (3-7 pax) to (8-14 pax)
    const coasterResult = await db
      .update(prices)
      .set({ 
        passenger_capacity: "8-14 pax",
        updated_at: new Date()
      })
      .where(eq(prices.vehicle_type, "Coaster"))
      .returning();

    console.log(`Updated ${coasterResult.length} Coaster records`);

    // Update Coach vehicles from (3-7 pax) to (15-38 pax)
    const coachResult = await db
      .update(prices)
      .set({ 
        passenger_capacity: "15-38 pax",
        updated_at: new Date()
      })
      .where(eq(prices.vehicle_type, "Coach"))
      .returning();

    console.log(`Updated ${coachResult.length} Coach records`);

    // Display updated records
    console.log("\nUpdated Coaster records:");
    coasterResult.forEach(record => {
      console.log(`- ${record.service_name} (${record.location}): ${record.passenger_capacity}`);
    });

    console.log("\nUpdated Coach records:");
    coachResult.forEach(record => {
      console.log(`- ${record.service_name} (${record.location}): ${record.passenger_capacity}`);
    });

    console.log("\nVehicle capacity updates completed successfully!");
    
  } catch (error) {
    console.error("Error updating vehicle capacities:", error);
  }
}

// Run the update
updateVehicleCapacities().then(() => {
  console.log("Update script finished");
  process.exit(0);
}).catch((error) => {
  console.error("Update script failed:", error);
  process.exit(1);
});
