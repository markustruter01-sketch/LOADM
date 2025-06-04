import fs from 'fs';
import { Pool } from '@neondatabase/serverless';

async function updatePDFContent() {
  // Read the base64 encoded PDF files
  const dgChecklistB64 = fs.readFileSync('./attached_assets/dg_checklist.b64', 'utf8').trim();
  const passengerManifestB64 = fs.readFileSync('./attached_assets/passenger_manifest.b64', 'utf8').trim();

  // Connect to database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Updating PDF content in database...');
    
    // Update DG Checklist (ID: 2)
    await pool.query(
      'UPDATE pdf_documents SET pdf_data = $1 WHERE id = 2',
      [dgChecklistB64]
    );
    console.log('✓ Updated DG Checklist PDF content');

    // Update Passenger Manifest (ID: 1)
    await pool.query(
      'UPDATE pdf_documents SET pdf_data = $1 WHERE id = 1',
      [passengerManifestB64]
    );
    console.log('✓ Updated Passenger Manifest PDF content');

    console.log('✓ All PDF documents updated successfully');
  } catch (error) {
    console.error('Error updating PDF content:', error);
  } finally {
    await pool.end();
  }
}

updatePDFContent();