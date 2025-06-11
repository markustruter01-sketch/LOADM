import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

class InstructorPortalTester {
  constructor() {
    this.sessionCookie = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async login() {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'markustruter01@gmail.com',
        password: 'password123'
      });

      if (response.status === 200 && response.headers['set-cookie']) {
        this.sessionCookie = response.headers['set-cookie'][0];
        this.log('Login successful as superadmin', 'success');
        return true;
      }
      return false;
    } catch (error) {
      this.log(`Login failed: ${error.message}`, 'error');
      return false;
    }
  }

  async fetchInstructorPortal() {
    try {
      const response = await axios.get(`${BASE_URL}/instructors-portal`, {
        headers: {
          'Cookie': this.sessionCookie,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (response.status === 200) {
        const html = response.data;
        
        // Check for button text changes
        const buttonChecks = [
          { old: 'Manage Quizzes', new: 'Create Pop Quiz' },
          { old: 'Edit Questions', new: 'Edit Quiz Questions' },
          { old: 'Manage Workforce', new: 'View Workforce' },
          { old: 'View Advanced Analytics', new: 'Workforce Performance Analytics' }
        ];

        let allChangesApplied = true;
        
        for (const check of buttonChecks) {
          const hasOld = html.includes(check.old);
          const hasNew = html.includes(check.new);
          
          if (hasOld) {
            this.log(`Found old text "${check.old}" - change not applied`, 'error');
            allChangesApplied = false;
          }
          
          if (hasNew) {
            this.log(`Found new text "${check.new}" - change applied`, 'success');
          } else {
            this.log(`Missing new text "${check.new}" - change not applied`, 'error');
            allChangesApplied = false;
          }
        }

        if (allChangesApplied) {
          this.log('All button text changes have been applied successfully!', 'success');
        } else {
          this.log('Some button text changes are missing', 'error');
        }

        return allChangesApplied;
      }
    } catch (error) {
      this.log(`Failed to fetch instructor portal: ${error.message}`, 'error');
      return false;
    }
  }

  async runTest() {
    this.log('Starting instructor portal button text verification...');
    
    if (await this.login()) {
      return await this.fetchInstructorPortal();
    }
    
    return false;
  }
}

async function testInstructorPortal() {
  const tester = new InstructorPortalTester();
  const success = await tester.runTest();
  
  if (success) {
    console.log('\n🎉 All instructor portal button changes are working!');
  } else {
    console.log('\n❌ Instructor portal button changes need more work');
  }
  
  return success;
}

testInstructorPortal().catch(console.error);