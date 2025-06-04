const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');

// Read environment variables
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addPDFDocuments() {
  try {
    // Read the base64 encoded PDF files
    const passengerManifestB64 = fs.readFileSync('./attached_assets/passenger_manifest.b64', 'utf8');
    const dgChecklistB64 = fs.readFileSync('./attached_assets/dg_checklist.b64', 'utf8');

    console.log('Read PDF files from base64 encoded files');
    console.log('Passenger manifest length:', passengerManifestB64.length);
    console.log('DG checklist length:', dgChecklistB64.length);

    // Insert PDF documents into the database
    const client = await pool.connect();

    try {
      // Insert Passenger and Cargo Manifest
      const passengerResult = await client.query(`
        INSERT INTO pdf_documents (title, description, type, category, file_name, file_size, content_type, pdf_data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id
      `, [
        'Passenger and Cargo Manifest',
        'Official form for documenting passengers, crew, and cargo details for military transport operations',
        'manifest',
        'operational',
        'Passenger_and_Cargo_Manifest.pdf',
        Math.round(passengerManifestB64.length * 0.75), // Approximate original file size
        'application/pdf',
        passengerManifestB64
      ]);

      console.log('Inserted Passenger and Cargo Manifest with ID:', passengerResult.rows[0].id);

      // Insert DG Checklist
      const dgResult = await client.query(`
        INSERT INTO pdf_documents (title, description, type, category, file_name, file_size, content_type, pdf_data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id
      `, [
        'Dangerous Goods Checklist',
        'Comprehensive checklist for handling dangerous goods in non-radioactive shipments according to IATA regulations',
        'checklist',
        'safety',
        'DG_Checklist.pdf',
        Math.round(dgChecklistB64.length * 0.75), // Approximate original file size
        'application/pdf',
        dgChecklistB64
      ]);

      console.log('Inserted DG Checklist with ID:', dgResult.rows[0].id);

    } finally {
      client.release();
    }

    console.log('Successfully added both PDF documents to the database');
    
  } catch (error) {
    console.error('Error adding PDF documents:', error);
  } finally {
    await pool.end();
  }
}

addPDFDocuments();