// Comprehensive Authentication Test
import bcrypt from 'bcryptjs';

async function testPasswordValidation() {
  console.log('🔐 COMPREHENSIVE AUTH TEST: Starting...');
  
  try {
    // Test the actual password hash from database
    const storedHash = '$2b$10$eC7/VIeojAEYULD4WpfpdeRuvZ8Er47XkbB0K8WtdzzIeq93NjVuq';
    const testPassword = 'Password1!';
    
    console.log('🧪 Testing password validation...');
    console.log('Password:', testPassword);
    console.log('Hash:', storedHash);
    
    const isValid = await bcrypt.compare(testPassword, storedHash);
    console.log('✅ Password validation result:', isValid);
    
    if (!isValid) {
      console.log('❌ Default password does not match hash!');
      
      // Test creating a new hash with the same password
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('🔧 New hash generated:', newHash);
      
      const newValidation = await bcrypt.compare(testPassword, newHash);
      console.log('✅ New hash validation:', newValidation);
    }
    
    // Test different variations
    const variations = [
      'Password1!',
      'password1!',
      'PASSWORD1!',
      'Password1',
      'password1'
    ];
    
    console.log('🔍 Testing password variations...');
    for (const variation of variations) {
      const result = await bcrypt.compare(variation, storedHash);
      console.log(`  "${variation}": ${result}`);
    }
    
  } catch (error) {
    console.error('❌ AUTH TEST FAILED:', error);
  }
}

testPasswordValidation();