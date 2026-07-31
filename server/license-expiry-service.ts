// License Expiry Management Service
// Handles automatic license expiry checking and enforcement

import { neon } from '@neondatabase/serverless';

export class LicenseExpiryService {
  private sql: any;

  constructor() {
    this.sql = neon(process.env.DATABASE_URL!);
  }

  async markExpiredLicensesInactive(): Promise<number> {
    console.log('🕒 LICENSE EXPIRY: Checking for expired licenses...');
    
    try {
      // Update expired licenses to inactive status
      const result = await this.sql`
        UPDATE licenses 
        SET is_active = false, 
            updated_at = NOW()
        WHERE expiry_date < NOW() 
        AND is_active = true
        AND license_type != 'superadmin'
        RETURNING email, license_key, expiry_date
      `;

      if (result.length > 0) {
        console.log(`🕒 LICENSE EXPIRY: Marked ${result.length} licenses as expired:`);
        result.forEach((license: any) => {
          console.log(`  - ${license.email} (${license.license_key}) expired on ${license.expiry_date}`);
        });
      } else {
        console.log('🕒 LICENSE EXPIRY: No expired licenses found');
      }

      return result.length;
    } catch (error) {
      console.error('🕒 LICENSE EXPIRY ERROR:', error);
      return 0;
    }
  }

  async checkLicenseStatus(email: string): Promise<{
    isValid: boolean;
    isExpired: boolean;
    expiryDate?: Date;
    licenseType?: string;
  }> {
    try {
      const result = await this.sql`
        SELECT 
          is_active,
          expiry_date,
          license_type,
          CASE 
            WHEN expiry_date < NOW() THEN true
            ELSE false
          END as is_expired
        FROM licenses 
        WHERE LOWER(email) = ${email.toLowerCase()}
        LIMIT 1
      `;

      if (!result[0]) {
        return { isValid: false, isExpired: false };
      }

      const license = result[0];
      const isExpired = license.is_expired || new Date(license.expiry_date) < new Date();
      
      // If license is expired but still marked as active, update it
      if (isExpired && license.is_active && license.license_type !== 'superadmin') {
        await this.sql`
          UPDATE licenses 
          SET is_active = false, updated_at = NOW()
          WHERE LOWER(email) = ${email.toLowerCase()}
        `;
        console.log(`🕒 LICENSE EXPIRY: Auto-disabled expired license for ${email}`);
      }

      return {
        isValid: license.is_active && !isExpired,
        isExpired: isExpired,
        expiryDate: new Date(license.expiry_date),
        licenseType: license.license_type
      };
    } catch (error) {
      console.error(`🕒 LICENSE EXPIRY ERROR checking ${email}:`, error);
      return { isValid: false, isExpired: false };
    }
  }

  async getAllExpiredLicenses() {
    try {
      const result = await this.sql`
        SELECT 
          email,
          license_key,
          license_type,
          is_active,
          expiry_date,
          EXTRACT(DAYS FROM (NOW() - expiry_date)) as days_expired
        FROM licenses 
        WHERE expiry_date < NOW()
        AND license_type != 'superadmin'
        ORDER BY expiry_date DESC
      `;

      return result;
    } catch (error) {
      console.error('🕒 LICENSE EXPIRY ERROR getting expired licenses:', error);
      return [];
    }
  }

  startPeriodicCheck() {
    console.log('🕒 LICENSE EXPIRY: Starting periodic license expiry checks (every 4 hours)');
    
    // Run initial check
    this.markExpiredLicensesInactive();
    
    // Schedule periodic checks every 4 hours
    setInterval(() => {
      this.markExpiredLicensesInactive();
    }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds
  }
}

export const licenseExpiryService = new LicenseExpiryService();