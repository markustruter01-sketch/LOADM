import { pool } from "./db";
import { hashPassword } from "./auth";

// Migration to update the user schema and create the Super Admin user
async function runMigration() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Starting database migration...');
    
    // 1. Check if email column exists
    const checkEmailColumn = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'email'
      );
    `);
    
    if (!checkEmailColumn.rows[0].exists) {
      console.log('Adding email column to users table...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN email TEXT NOT NULL DEFAULT '';
      `);
    }
    
    // 2. Check if isSuperAdmin column exists
    const checkSuperAdminColumn = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'is_super_admin'
      );
    `);
    
    if (!checkSuperAdminColumn.rows[0].exists) {
      console.log('Adding is_super_admin column to users table...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;
      `);
    }
    
    // 3. Create a super admin user if it doesn't exist
    const superAdminEmail = 'markustruter01@gmail.com';
    const checkSuperAdmin = await client.query(`
      SELECT * FROM users 
      WHERE email = $1 OR username = $2
    `, [superAdminEmail, 'superadmin']);
    
    if (checkSuperAdmin.rows.length === 0) {
      console.log('Creating Super Admin user...');
      const superAdminPassword = await hashPassword('ThisIsLOADMWorkflowPassword1!');
      
      await client.query(`
        INSERT INTO users (username, email, password, is_admin, is_super_admin)
        VALUES ($1, $2, $3, TRUE, TRUE)
      `, ['superadmin', superAdminEmail, superAdminPassword]);
    } else {
      console.log('Super Admin user already exists, updating permissions...');
      await client.query(`
        UPDATE users 
        SET is_admin = TRUE, is_super_admin = TRUE
        WHERE email = $1 OR username = $2
      `, [superAdminEmail, 'superadmin']);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });