
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import { storage } from './storage';

interface AlexandriaCSVRow {
  'Service Name ': string;
  ' Category ': string;
  ' Route Name ': string;
  ' Cost Basis ': string;
  ' Unit ': string;
  ' Base Cost ': string;
  ' Notes ': string;
  ' Vehicle Type ': string;
  ' Passenger Capacity ': string;
}

async function processAlexandriaCSV() {
  try {
    // Read the CSV file
    const csvPath = 'attached_assets/Alexandria - Alexandria_1759235799534.csv';
    const fileContent = await fs.readFile(csvPath, 'utf-8');
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as AlexandriaCSVRow[];

    const pricesToCreate: any[] = [];
    let processedCount = 0;
    let skippedCount = 0;

    // Process each record
    for (const record of records) {
      try {
        // Clean and extract data
        const serviceName = record['Service Name ']?.trim();
        const category = record[' Category ']?.trim();
        const routeName = record[' Route Name ']?.trim();
        const costBasis = record[' Cost Basis ']?.trim();
        const unit = record[' Unit ']?.trim();
        const baseCostStr = record[' Base Cost ']?.trim();
        const notes = record[' Notes ']?.trim();
        const vehicleType = record[' Vehicle Type ']?.trim();
        const passengerCapacity = record[' Passenger Capacity ']?.trim();

        // Skip if missing essential data
        if (!serviceName || !baseCostStr || baseCostStr === '.' || baseCostStr === '') {
          console.log(`Skipping row with missing data: ${serviceName}`);
          skippedCount++;
          continue;
        }

        // Extract numeric price from base cost (remove € symbol and convert)
        const priceMatch = baseCostStr.match(/(\d+(?:\.\d+)?)/);
        if (!priceMatch) {
          console.log(`Skipping row with invalid price: ${serviceName} - ${baseCostStr}`);
          skippedCount++;
          continue;
        }
        const unitPrice = parseFloat(priceMatch[1]);

        // Map cost basis to unit_type
        let unitType: string;
        switch (costBasis?.toLowerCase()) {
          case 'per_group':
            unitType = 'per_group';
            break;
          case 'per_person':
            unitType = 'per_person';
            break;
          case 'per_night':
            unitType = 'per_night';
            break;
          case 'per_day':
            unitType = 'per_day';
            break;
          default:
            unitType = 'per_group'; // Default to per_group for transport
        }

        // Create description combining route, notes, vehicle type, and capacity
        const descriptionParts = [
          routeName,
          notes,
          vehicleType ? `Vehicle: ${vehicleType}` : '',
          passengerCapacity ? `Capacity: ${passengerCapacity}` : ''
        ].filter(Boolean);
        
        const description = descriptionParts.join(' | ');

        pricesToCreate.push({
          service_name: serviceName,
          category: category || 'transport',
          description: description || null,
          unit_type: unitType,
          unit_price: unitPrice,
          currency: 'EUR',
          location: 'Alexandria',
          is_active: true
        });

        processedCount++;
      } catch (error) {
        console.error(`Error processing row: ${record['Service Name ']}`, error);
        skippedCount++;
      }
    }

    console.log(`\nProcessed ${processedCount} records, skipped ${skippedCount} records`);
    console.log('Sample records to be created:');
    console.log(JSON.stringify(pricesToCreate.slice(0, 3), null, 2));

    if (pricesToCreate.length > 0) {
      // Bulk insert into database
      console.log(`\nInserting ${pricesToCreate.length} records into database...`);
      const createdPrices = await storage.bulkCreatePrices(pricesToCreate);
      console.log(`Successfully created ${createdPrices.length} price records`);
      
      return {
        success: true,
        processed: processedCount,
        skipped: skippedCount,
        created: createdPrices.length
      };
    } else {
      console.log('No valid records to insert');
      return {
        success: false,
        processed: 0,
        skipped: skippedCount,
        created: 0
      };
    }

  } catch (error) {
    console.error('Error processing Alexandria CSV:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  processAlexandriaCSV()
    .then(result => {
      console.log('Final result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { processAlexandriaCSV };
