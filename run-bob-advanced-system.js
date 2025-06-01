#!/usr/bin/env node

// Bob Advanced System - Comprehensive Quiz System Troubleshooter
console.log('🤖 BOB ADVANCED SYSTEM v2.0 - Quiz Creation Troubleshooter');
console.log('='.repeat(60));

import fs from 'fs';
import path from 'path';

// System Health Monitor
function checkSystemHealth() {
  console.log('\n🔍 SYSTEM HEALTH CHECK');
  console.log('-'.repeat(30));
  
  // Check critical files
  const criticalFiles = [
    'client/src/pages/instructors-portal/quizzes/create.tsx',
    'server/routes/quizzes.ts',
    'server/routes.ts',
    'shared/quiz-questions.ts'
  ];
  
  let healthScore = 0;
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} - EXISTS`);
      healthScore += 25;
    } else {
      console.log(`❌ ${file} - MISSING`);
    }
  });
  
  console.log(`\n📊 System Health: ${healthScore}%`);
  return healthScore;
}

// Authentication Diagnostics
function diagnoseMath() {
  console.log('\n🔐 AUTHENTICATION DIAGNOSTICS');
  console.log('-'.repeat(30));
  
  try {
    const routesFile = fs.readFileSync('server/routes.ts', 'utf8');
    
    // Check for user endpoint
    if (routesFile.includes('app.get("/api/user"')) {
      console.log('✅ User endpoint exists');
    } else {
      console.log('❌ User endpoint missing');
    }
    
    // Check for auth middleware
    if (routesFile.includes('requireAuth')) {
      console.log('✅ Auth middleware found');
    } else {
      console.log('❌ Auth middleware missing');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Cannot read routes file:', error.message);
    return false;
  }
}

// Quiz Form Analysis
function analyzeQuizForm() {
  console.log('\n📝 QUIZ FORM ANALYSIS');
  console.log('-'.repeat(30));
  
  try {
    const createFile = fs.readFileSync('client/src/pages/instructors-portal/quizzes/create.tsx', 'utf8');
    
    // Check form submission
    if (createFile.includes('onSubmit')) {
      console.log('✅ Form submission handler exists');
    } else {
      console.log('❌ Form submission handler missing');
    }
    
    // Check API call
    if (createFile.includes('apiRequest')) {
      console.log('✅ API request function found');
    } else {
      console.log('❌ API request function missing');
    }
    
    // Check error handling
    if (createFile.includes('catch (error)')) {
      console.log('✅ Error handling implemented');
    } else {
      console.log('❌ Error handling missing');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Cannot read create form file:', error.message);
    return false;
  }
}

// Server Routes Check
function checkServerRoutes() {
  console.log('\n🛠️ SERVER ROUTES ANALYSIS');
  console.log('-'.repeat(30));
  
  try {
    const quizRoutesFile = fs.readFileSync('server/routes/quizzes.ts', 'utf8');
    
    // Check POST route
    if (quizRoutesFile.includes('router.post(')) {
      console.log('✅ POST route for quiz creation exists');
    } else {
      console.log('❌ POST route for quiz creation missing');
    }
    
    // Check database operations
    if (quizRoutesFile.includes('INSERT INTO quizzes')) {
      console.log('✅ Database insert operation found');
    } else {
      console.log('❌ Database insert operation missing');
    }
    
    // Check authentication
    if (quizRoutesFile.includes('requireInstructor')) {
      console.log('✅ Instructor authentication check exists');
    } else {
      console.log('❌ Instructor authentication check missing');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Cannot read quiz routes file:', error.message);
    return false;
  }
}

// Database Schema Check
function checkDatabaseSchema() {
  console.log('\n🗄️ DATABASE SCHEMA CHECK');
  console.log('-'.repeat(30));
  
  try {
    const schemaFile = fs.readFileSync('shared/schema.ts', 'utf8');
    
    if (schemaFile.includes('quizzes') && schemaFile.includes('title')) {
      console.log('✅ Quiz schema properly defined');
      return true;
    } else {
      console.log('❌ Quiz schema issues detected');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot read schema file:', error.message);
    return false;
  }
}

// Issue Detection and Recommendations
function detectIssues() {
  console.log('\n🎯 ISSUE DETECTION & RECOMMENDATIONS');
  console.log('-'.repeat(40));
  
  const issues = [];
  const recommendations = [];
  
  // Run all diagnostics
  const systemHealth = checkSystemHealth();
  const authOk = diagnoseMath();
  const formOk = analyzeQuizForm();
  const routesOk = checkServerRoutes();
  const schemaOk = checkDatabaseSchema();
  
  if (systemHealth < 100) {
    issues.push('Missing critical system files');
    recommendations.push('Restore missing files from backup');
  }
  
  if (!authOk) {
    issues.push('Authentication system malfunction');
    recommendations.push('Fix user endpoint and auth middleware');
  }
  
  if (!formOk) {
    issues.push('Quiz form implementation issues');
    recommendations.push('Check form submission and API calls');
  }
  
  if (!routesOk) {
    issues.push('Server routes not properly configured');
    recommendations.push('Verify POST route and database operations');
  }
  
  if (!schemaOk) {
    issues.push('Database schema problems');
    recommendations.push('Check quiz table definition');
  }
  
  console.log('\n🚨 DETECTED ISSUES:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  
  console.log('\n💡 RECOMMENDATIONS:');
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
  
  return { issues, recommendations };
}

// Main execution
async function main() {
  const results = detectIssues();
  
  console.log('\n🔧 BOB ANALYSIS COMPLETE');
  console.log('='.repeat(30));
  
  if (results.issues.length === 0) {
    console.log('✅ No critical issues detected. Quiz system should be operational.');
  } else {
    console.log(`❌ Found ${results.issues.length} critical issues requiring attention.`);
  }
  
  console.log('\n🤖 Bob Advanced System standing by for further diagnostics...');
}

// Run the system
main().catch(console.error);