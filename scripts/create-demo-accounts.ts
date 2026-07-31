// One-off script: create generic demo accounts
// Idempotent — skips emails that already exist
// Run: npx tsx scripts/create-demo-accounts.ts

import { neon } from '@neondatabase/serverless';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

const DEMO_PASSWORD = process.env.DEMO_TEST_PASSWORD;
if (!DEMO_PASSWORD) {
  console.error('DEMO_TEST_PASSWORD NOT SET');
  process.exit(1);
}

const accounts = [
  {
    email: 'demo.loadmaster@loadm-demo.invalid',
    firstName: 'Demo',
    lastName: 'Loadmaster',
    role: 'loadmaster',
    squadron: '33SQN',
    category: 'C',
  },
  {
    email: 'demo.instructor@loadm-demo.invalid',
    firstName: 'Demo',
    lastName: 'Instructor',
    role: 'instructor',
    squadron: '33SQN',
    category: 'B',
  },
  {
    email: 'demo.leadership@loadm-demo.invalid',
    firstName: 'Demo',
    lastName: 'Leadership',
    role: 'leadership',
    squadron: 'AMG',
    category: 'A',
  },
];

async function main() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD!, 12);

  for (const acct of accounts) {
    // Idempotent check: skip if user email already exists
    const existing = await sql`SELECT id FROM users WHERE LOWER(email) = ${acct.email.toLowerCase()} LIMIT 1`;
    if (existing.length > 0) {
      console.log(`SKIP (already exists): ${acct.email}`);
      continue;
    }

    // License key matching the format in server/routes/licensing.ts
    const licenseKey = `LIC-${acct.firstName.toUpperCase()}-${Date.now()}`;

    // Create license
    const licenseRows = await sql`
      INSERT INTO licenses (
        license_key, email, first_name, last_name,
        license_type, is_active, expiry_date,
        squadron, category,
        max_concurrent_sessions, max_devices,
        created_by_admin, notes
      ) VALUES (
        ${licenseKey}, ${acct.email}, ${acct.firstName}, ${acct.lastName},
        ${acct.role}, true, '2030-01-01',
        ${acct.squadron}, ${acct.category},
        3, 2,
        9, ''
      ) RETURNING id
    `;
    const licenseId = licenseRows[0].id;

    // Create user
    const userRows = await sql`
      INSERT INTO users (
        email, hashed_password, is_first_login,
        license_id, created_by, user_role,
        is_admin, is_super_admin,
        first_name, last_name
      ) VALUES (
        ${acct.email}, ${hashedPassword}, false,
        ${licenseId}, 9, ${acct.role},
        ${acct.role === 'instructor' || acct.role === 'leadership'}, false,
        ${acct.firstName}, ${acct.lastName}
      ) RETURNING id
    `;

    console.log(`CREATED: ${acct.email} | user_id=${userRows[0].id} | license_id=${licenseId} | license_key=${licenseKey}`);
  }
  console.log('Done.');
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
