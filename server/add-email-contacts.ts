import { db } from "./db";
import { phoneDirectory } from "@shared/schema";
import { eq } from "drizzle-orm";

// Updated contact structure with email addresses
const airportUpdates = [
  {
    airbaseCode: 'ADL',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-8-8308-9211', description: 'Ground Services', email: 'ground.handling@adelaide.airport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-8-8308-9200', description: 'Air Traffic Control', email: 'atc@adelaide.airport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-8-8308-9100', description: 'Operations Center', email: 'operations@adelaide.airport.com.au' }
    ]
  },
  {
    airbaseCode: 'ATL',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+1-404-305-7300', description: 'Ground Services', email: 'ground.ops@atl.airport.com' },
      { id: '5', name: 'ATC Email', phoneNumber: '+1-404-305-7200', description: 'Air Traffic Control', email: 'atc.tower@atl.airport.com' },
      { id: '6', name: 'Operations Email', phoneNumber: '+1-404-305-7277', description: 'Operations Center', email: 'operations@atl.airport.com' }
    ]
  },
  {
    airbaseCode: 'BNE',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-7-3406-3000', description: 'Ground Services', email: 'ground.services@bne.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-7-3406-3100', description: 'Air Traffic Control', email: 'atc@bne.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-7-3406-3200', description: 'Operations Center', email: 'operations@bne.com.au' }
    ]
  },
  {
    airbaseCode: 'CNS',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-7-4080-6703', description: 'Ground Services', email: 'ground.ops@cairnsairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-7-4080-6700', description: 'Air Traffic Control', email: 'atc@cairnsairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-7-4080-6701', description: 'Operations Center', email: 'operations@cairnsairport.com.au' }
    ]
  },
  {
    airbaseCode: 'CBR',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-2-6275-2226', description: 'Ground Services', email: 'ground.services@canberraairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-2-6275-2200', description: 'Air Traffic Control', email: 'atc@canberraairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-2-6275-2100', description: 'Operations Center', email: 'operations@canberraairport.com.au' }
    ]
  },
  {
    airbaseCode: 'DRW',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-8-8920-1805', description: 'Ground Services', email: 'ground.handling@ntairports.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-8-8920-1800', description: 'Air Traffic Control', email: 'atc@ntairports.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-8-8920-1801', description: 'Operations Center', email: 'operations@ntairports.com.au' }
    ]
  },
  {
    airbaseCode: 'DXB',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+971-4-224-5700', description: 'Ground Services', email: 'ground.ops@dubaiairports.ae' },
      { id: '5', name: 'ATC Email', phoneNumber: '+971-4-224-5600', description: 'Air Traffic Control', email: 'atc@dubaiairports.ae' },
      { id: '6', name: 'Operations Email', phoneNumber: '+971-4-224-5555', description: 'Operations Center', email: 'operations@dubaiairports.ae' }
    ]
  },
  {
    airbaseCode: 'FRA',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+49-69-690-7200', description: 'Ground Services', email: 'ground.services@fraport.de' },
      { id: '5', name: 'ATC Email', phoneNumber: '+49-69-690-7100', description: 'Air Traffic Control', email: 'atc@fraport.de' },
      { id: '6', name: 'Operations Email', phoneNumber: '+49-69-690-70', description: 'Operations Center', email: 'operations@fraport.de' }
    ]
  },
  {
    airbaseCode: 'GLD',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-7-5589-1100', description: 'Ground Services', email: 'ground.services@goldcoastairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-7-5589-1200', description: 'Air Traffic Control', email: 'atc@goldcoastairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-7-5589-1300', description: 'Operations Center', email: 'operations@goldcoastairport.com.au' }
    ]
  },
  {
    airbaseCode: 'HND',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+81-3-5757-8300', description: 'Ground Services', email: 'ground.ops@haneda-airport.jp' },
      { id: '5', name: 'ATC Email', phoneNumber: '+81-3-5757-8200', description: 'Air Traffic Control', email: 'atc@haneda-airport.jp' },
      { id: '6', name: 'Operations Email', phoneNumber: '+81-3-5757-8111', description: 'Operations Center', email: 'operations@haneda-airport.jp' }
    ]
  },
  {
    airbaseCode: 'HBA',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-3-6216-1600', description: 'Ground Services', email: 'ground.services@hobartairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-3-6216-1700', description: 'Air Traffic Control', email: 'atc@hobartairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-3-6216-1800', description: 'Operations Center', email: 'operations@hobartairport.com.au' }
    ]
  },
  {
    airbaseCode: 'HKG',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+852-2181-8950', description: 'Ground Services', email: 'ground.ops@hkairport.com' },
      { id: '5', name: 'ATC Email', phoneNumber: '+852-2181-8900', description: 'Air Traffic Control', email: 'atc@hkairport.com' },
      { id: '6', name: 'Operations Email', phoneNumber: '+852-2181-8888', description: 'Operations Center', email: 'operations@hkairport.com' }
    ]
  },
  {
    airbaseCode: 'ICN',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+82-32-741-2300', description: 'Ground Services', email: 'ground.ops@airport.kr' },
      { id: '5', name: 'ATC Email', phoneNumber: '+82-32-741-2200', description: 'Air Traffic Control', email: 'atc@airport.kr' },
      { id: '6', name: 'Operations Email', phoneNumber: '+82-32-741-2114', description: 'Operations Center', email: 'operations@airport.kr' }
    ]
  },
  {
    airbaseCode: 'JFK',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+1-718-244-4600', description: 'Ground Services', email: 'ground.ops@jfkairport.com' },
      { id: '5', name: 'ATC Email', phoneNumber: '+1-718-244-4500', description: 'Air Traffic Control', email: 'atc.tower@jfkairport.com' },
      { id: '6', name: 'Operations Email', phoneNumber: '+1-718-244-4444', description: 'Operations Center', email: 'operations@jfkairport.com' }
    ]
  },
  {
    airbaseCode: 'LAX',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+1-310-646-5400', description: 'Ground Services', email: 'ground.services@lawa.org' },
      { id: '5', name: 'ATC Email', phoneNumber: '+1-310-646-5300', description: 'Air Traffic Control', email: 'atc@lawa.org' },
      { id: '6', name: 'Operations Email', phoneNumber: '+1-310-646-5252', description: 'Operations Center', email: 'operations@lawa.org' }
    ]
  },
  {
    airbaseCode: 'LHR',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+44-20-8759-4400', description: 'Ground Services', email: 'ground.ops@heathrow.com' },
      { id: '5', name: 'ATC Email', phoneNumber: '+44-20-8759-4321', description: 'Air Traffic Control', email: 'atc@heathrow.com' },
      { id: '6', name: 'Operations Email', phoneNumber: '+44-844-335-1801', description: 'Operations Center', email: 'operations@heathrow.com' }
    ]
  },
  {
    airbaseCode: 'MEL',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-3-9297-1600', description: 'Ground Services', email: 'ground.services@melbourneairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-3-9297-1700', description: 'Air Traffic Control', email: 'atc@melbourneairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-3-9297-1800', description: 'Operations Center', email: 'operations@melbourneairport.com.au' }
    ]
  },
  {
    airbaseCode: 'NRT',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+81-476-34-8200', description: 'Ground Services', email: 'ground.services@naa.jp' },
      { id: '5', name: 'ATC Email', phoneNumber: '+81-476-34-8100', description: 'Air Traffic Control', email: 'atc@naa.jp' },
      { id: '6', name: 'Operations Email', phoneNumber: '+81-476-34-8000', description: 'Operations Center', email: 'operations@naa.jp' }
    ]
  },
  {
    airbaseCode: 'NTL',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-2-4928-9800', description: 'Ground Services', email: 'ground.services@newcastleairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-2-4928-9900', description: 'Air Traffic Control', email: 'atc@newcastleairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-2-4928-9000', description: 'Operations Center', email: 'operations@newcastleairport.com.au' }
    ]
  },
  {
    airbaseCode: 'ORD',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+1-773-686-2400', description: 'Ground Services', email: 'ground.ops@flychicago.com' },
      { id: '5', name: 'ATC Email', phoneNumber: '+1-773-686-2300', description: 'Air Traffic Control', email: 'atc@flychicago.com' },
      { id: '6', name: 'Operations Email', phoneNumber: '+1-773-686-2200', description: 'Operations Center', email: 'operations@flychicago.com' }
    ]
  },
  {
    airbaseCode: 'PER',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-8-9478-8888', description: 'Ground Services', email: 'ground.services@perthairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-8-9478-8900', description: 'Air Traffic Control', email: 'atc@perthairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-8-9478-8000', description: 'Operations Center', email: 'operations@perthairport.com.au' }
    ]
  },
  {
    airbaseCode: 'ROK',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-7-4936-0100', description: 'Ground Services', email: 'ground.services@rockhamptonairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-7-4936-0200', description: 'Air Traffic Control', email: 'atc@rockhamptonairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-7-4936-0300', description: 'Operations Center', email: 'operations@rockhamptonairport.com.au' }
    ]
  },
  {
    airbaseCode: 'SIN',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+65-6542-1200', description: 'Ground Services', email: 'ground.ops@changiairport.com' },
      { id: '5', name: 'ATC Email', phoneNumber: '+65-6542-1122', description: 'Air Traffic Control', email: 'atc@changiairport.com' },
      { id: '6', name: 'Operations Email', phoneNumber: '+65-6595-6868', description: 'Operations Center', email: 'operations@changiairport.com' }
    ]
  },
  {
    airbaseCode: 'SYD',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-2-9667-9111', description: 'Ground Services', email: 'ground.services@sydneyairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-2-9667-9200', description: 'Air Traffic Control', email: 'atc@sydneyairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-2-9667-9300', description: 'Operations Center', email: 'operations@sydneyairport.com.au' }
    ]
  },
  {
    airbaseCode: 'TSV',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-7-4727-3211', description: 'Ground Services', email: 'ground.services@townsvilleairport.com.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-7-4727-3300', description: 'Air Traffic Control', email: 'atc@townsvilleairport.com.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-7-4727-3400', description: 'Operations Center', email: 'operations@townsvilleairport.com.au' }
    ]
  },
  {
    airbaseCode: 'WGA',
    additionalContacts: [
      { id: '4', name: 'Ground Handling Email', phoneNumber: '+61-2-6925-2713', description: 'Ground Services', email: 'ground.services@wagga.nsw.gov.au' },
      { id: '5', name: 'ATC Email', phoneNumber: '+61-2-6925-2800', description: 'Air Traffic Control', email: 'atc@wagga.nsw.gov.au' },
      { id: '6', name: 'Operations Email', phoneNumber: '+61-2-6925-2900', description: 'Operations Center', email: 'operations@wagga.nsw.gov.au' }
    ]
  }
];

export async function addEmailContacts() {
  try {
    console.log('Adding email contacts to all airports...');
    
    for (const update of airportUpdates) {
      const existing = await db.select().from(phoneDirectory)
        .where(eq(phoneDirectory.airbaseCode, update.airbaseCode));
      
      if (existing.length > 0) {
        const entry = existing[0];
        const updatedContacts = [...entry.contacts, ...update.additionalContacts];
        
        await db.update(phoneDirectory)
          .set({ contacts: updatedContacts })
          .where(eq(phoneDirectory.id, entry.id));
        
        console.log(`Updated: ${entry.airbaseName} (${update.airbaseCode}) - Added ${update.additionalContacts.length} email contacts`);
      } else {
        console.log(`Skipped: ${update.airbaseCode} - not found`);
      }
    }
    
    console.log('Email contacts addition completed!');
  } catch (error) {
    console.error('Error adding email contacts:', error);
    throw error;
  }
}

// Run the migration
addEmailContacts()
  .then(() => {
    console.log('Email contacts script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Email contacts script failed:', error);
    process.exit(1);
  });