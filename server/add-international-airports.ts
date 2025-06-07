import { db } from "./db";
import { phoneDirectory } from "@shared/schema";
import { eq } from "drizzle-orm";

// Major international airports with sample contacts
const internationalAirports = [
  {
    airbaseCode: 'ATL',
    airbaseName: 'Atlanta Hartsfield-Jackson International Airport',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+1-404-305-7277', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+1-404-305-7200', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+1-404-305-7300', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'DXB',
    airbaseName: 'Dubai International Airport',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+971-4-224-5555', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+971-4-224-5600', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+971-4-224-5700', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'FRA',
    airbaseName: 'Frankfurt Airport',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+49-69-690-70', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+49-69-690-7100', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+49-69-690-7200', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'HND',
    airbaseName: 'Haneda Airport Tokyo',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+81-3-5757-8111', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+81-3-5757-8200', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+81-3-5757-8300', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'HKG',
    airbaseName: 'Hong Kong International Airport',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+852-2181-8888', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+852-2181-8900', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+852-2181-8950', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'ICN',
    airbaseName: 'Incheon International Airport Seoul',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+82-32-741-2114', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+82-32-741-2200', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+82-32-741-2300', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'JFK',
    airbaseName: 'John F. Kennedy International Airport',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+1-718-244-4444', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+1-718-244-4500', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+1-718-244-4600', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'LAX',
    airbaseName: 'Los Angeles International Airport',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+1-310-646-5252', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+1-310-646-5300', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+1-310-646-5400', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'LHR',
    airbaseName: 'London Heathrow Airport',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+44-844-335-1801', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+44-20-8759-4321', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+44-20-8759-4400', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'NRT',
    airbaseName: 'Narita International Airport',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+81-476-34-8000', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+81-476-34-8100', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+81-476-34-8200', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'ORD',
    airbaseName: 'O\'Hare International Airport Chicago',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+1-773-686-2200', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+1-773-686-2300', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+1-773-686-2400', description: 'Ground Handling' }
    ]
  },
  {
    airbaseCode: 'SIN',
    airbaseName: 'Singapore Changi Airport',
    contacts: [
      { id: '1', name: 'Operations Center', phoneNumber: '+65-6595-6868', description: 'Main Operations' },
      { id: '2', name: 'Air Traffic Control', phoneNumber: '+65-6542-1122', description: 'ATC Tower' },
      { id: '3', name: 'Ground Services', phoneNumber: '+65-6542-1200', description: 'Ground Handling' }
    ]
  }
];

export async function addInternationalAirports() {
  try {
    console.log('Adding international airports to phone directory...');
    
    for (const airport of internationalAirports) {
      // Check if airport already exists
      const existing = await db.select().from(phoneDirectory)
        .where(eq(phoneDirectory.airbaseCode, airport.airbaseCode));
      
      if (existing.length === 0) {
        await db.insert(phoneDirectory).values({
          airbaseCode: airport.airbaseCode,
          airbaseName: airport.airbaseName,
          contacts: airport.contacts
        });
        console.log(`Added: ${airport.airbaseName} (${airport.airbaseCode})`);
      } else {
        console.log(`Skipped: ${airport.airbaseName} (${airport.airbaseCode}) - already exists`);
      }
    }
    
    console.log('International airports addition completed!');
  } catch (error) {
    console.error('Error adding international airports:', error);
    throw error;
  }
}

// Run the migration
addInternationalAirports()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });