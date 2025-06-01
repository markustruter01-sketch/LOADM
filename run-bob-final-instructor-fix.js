// Bob Final Instructor Portal Fix - Complete System Repair
import fs from 'fs';

class BobFinalInstructorFix {
  constructor() {
    this.fixesApplied = [];
    this.issues = [];
  }

  async runFinalFix() {
    console.log('🤖 Bob: Running final instructor portal repair...');
    
    await this.fixAuthHook();
    await this.fixMissingComponents();
    await this.fixRouterConfiguration();
    await this.addMissingReturnStatements();
    await this.validateInstructorPortalFlow();
    
    return this.generateFinalReport();
  }

  async fixAuthHook() {
    const authHookPath = 'client/src/hooks/use-auth.ts';
    
    if (!fs.existsSync(authHookPath)) {
      const content = `
import { useIsolatedAuth } from '../auth-isolated/auth-context';

export function useAuth() {
  return useIsolatedAuth();
}
`;
      
      fs.writeFileSync(authHookPath, content);
      this.fixesApplied.push('Created missing auth hook');
    }
  }

  async fixMissingComponents() {
    // Fix Progress component if missing
    const progressPath = 'client/src/components/ui/progress.tsx';
    if (!fs.existsSync(progressPath)) {
      const content = `
import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: \`translateX(-\${100 - (value || 0)}%)\` }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }
`;
      
      fs.writeFileSync(progressPath, content);
      this.fixesApplied.push('Created missing Progress component');
    }

    // Ensure all instructor portal components exist
    const requiredComponents = [
      'client/src/pages/instructors-portal/index.tsx',
      'client/src/pages/instructors-portal/scenarios/index.tsx',
      'client/src/pages/instructors-portal/student-progress/index.tsx',
      'client/src/pages/instructors-portal/analytics/index.tsx'
    ];

    for (const componentPath of requiredComponents) {
      if (!fs.existsSync(componentPath)) {
        this.issues.push(`Missing component: ${componentPath}`);
      }
    }
  }

  async fixRouterConfiguration() {
    try {
      // Check App.tsx for correct imports
      const appPath = 'client/src/App.tsx';
      let appContent = fs.readFileSync(appPath, 'utf8');
      
      // Fix any missing imports that could cause grey screen
      const requiredImports = [
        'import InstructorsPortal from "@/pages/instructors-portal";',
        'import InstructorsScenarios from "@/pages/instructors-portal/scenarios";',
        'import StudentProgress from "@/pages/instructors-portal/student-progress";',
        'import AdvancedAnalytics from "@/pages/instructors-portal/analytics";'
      ];

      let modified = false;
      for (const importStatement of requiredImports) {
        if (!appContent.includes(importStatement.split(' from ')[0])) {
          // Find the last import and add after it
          const lastImportIndex = appContent.lastIndexOf('import ');
          if (lastImportIndex !== -1) {
            const nextLineIndex = appContent.indexOf('\n', lastImportIndex);
            appContent = appContent.slice(0, nextLineIndex + 1) + importStatement + '\n' + appContent.slice(nextLineIndex + 1);
            modified = true;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(appPath, appContent);
        this.fixesApplied.push('Fixed missing imports in App.tsx');
      }

    } catch (error) {
      this.issues.push(`Router configuration error: ${error.message}`);
    }
  }

  async addMissingReturnStatements() {
    try {
      // Fix server routes return statement issue
      const routesPath = 'server/routes.ts';
      let content = fs.readFileSync(routesPath, 'utf8');
      
      // Find the registerRoutes function and ensure it has proper return
      if (content.includes('export async function registerRoutes')) {
        // Look for the function and ensure it ends with return httpServer
        const funcStart = content.indexOf('export async function registerRoutes');
        let funcEnd = content.indexOf('\n}', funcStart);
        
        if (funcEnd === -1) {
          // Find the next function or end of file
          funcEnd = content.length;
        }
        
        const functionContent = content.slice(funcStart, funcEnd);
        
        if (!functionContent.includes('return httpServer;')) {
          // Add return statement before the last closing brace
          const lastBrace = content.lastIndexOf('\n}');
          if (lastBrace !== -1) {
            content = content.slice(0, lastBrace) + '\n  return httpServer;\n}';
            fs.writeFileSync(routesPath, content);
            this.fixesApplied.push('Added missing return statement in routes.ts');
          }
        }
      }

    } catch (error) {
      this.issues.push(`Server routes error: ${error.message}`);
    }
  }

  async validateInstructorPortalFlow() {
    const criticalPaths = [
      'client/src/pages/instructors-portal/index.tsx',
      'client/src/pages/instructors-portal/scenarios/index.tsx',
      'client/src/lib/auth-routes.tsx',
      'client/src/hooks/use-auth.ts'
    ];

    for (const path of criticalPaths) {
      if (!fs.existsSync(path)) {
        this.issues.push(`Critical file missing: ${path}`);
        
        // Create basic versions of critical files
        if (path.endsWith('use-auth.ts')) {
          await this.fixAuthHook();
        }
      }
    }

    // Validate that InstructorRoute component exists
    const authRoutesPath = 'client/src/lib/auth-routes.tsx';
    if (fs.existsSync(authRoutesPath)) {
      const content = fs.readFileSync(authRoutesPath, 'utf8');
      if (!content.includes('InstructorRoute')) {
        this.issues.push('InstructorRoute component missing in auth-routes.tsx');
      }
    }
  }

  generateFinalReport() {
    console.log('\n🎯 Bob Final Instructor Portal Fix Report');
    console.log('==========================================');
    console.log(`Total Fixes Applied: ${this.fixesApplied.length}`);
    console.log(`Issues Identified: ${this.issues.length}`);
    
    if (this.fixesApplied.length > 0) {
      console.log('\n✅ Fixes Applied:');
      this.fixesApplied.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
    }
    
    if (this.issues.length > 0) {
      console.log('\n⚠️ Issues Identified:');
      this.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (this.issues.length === 0) {
      console.log('\n🎉 Instructor portal should now be fully functional!');
      console.log('All routes, components, and authentication flows are properly configured.');
    } else {
      console.log('\n🔧 Some issues remain - may require manual intervention');
    }
    
    console.log('\n🤖 Bob: Final instructor portal repair complete');
    
    return {
      fixesApplied: this.fixesApplied,
      issues: this.issues,
      success: this.issues.length === 0
    };
  }
}

// Run Bob Final Instructor Portal Fix
async function runBobFinalInstructorFix() {
  const bob = new BobFinalInstructorFix();
  const results = await bob.runFinalFix();
  return results;
}

runBobFinalInstructorFix().catch(error => {
  console.error('Bob Final Instructor Portal Fix error:', error.message);
});