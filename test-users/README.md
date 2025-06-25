# Test Data Generation System

This isolated system generates comprehensive test data for the LOADMworkflow analytics system without affecting real user data.

## Overview

The test data generation creates:
- **200 test users** distributed evenly across 4 squadrons (33SQN, 35SQN, 36SQN, 37SQN)
- **8 test quizzes** covering all quiz categories
- **800 test submissions** with realistic score distributions

## Safety Features

- **Isolated Email Domain**: All test users use `@testdomain.mil` emails
- **Distinct Naming**: Test quizzes have specific patterns for identification
- **Safe Cleanup**: Cleanup script only targets test data patterns
- **No Real Data Impact**: Real users and production data remain untouched

## Usage

### Generate Test Data
```bash
node test-users/generate-test-data.js
```

### Cleanup Test Data
```bash
node test-users/cleanup-test-data.js
```

## Test Data Structure

### Users
- **Distribution**: 50 users per squadron (33SQN, 35SQN, 36SQN, 37SQN)
- **Email Pattern**: `testuser[1-200]@testdomain.mil`
- **Password**: `testpass123` (hashed)
- **Role**: All set to 'student'
- **Names**: Realistic first/last name combinations

### Quiz Categories
1. Dangerous Goods Assessment
2. Loadmaster Fundamentals Assessment  
3. Emergency Procedures Assessment
4. Weight Balance Assessment
5. Cargo Securing Assessment
6. Aircraft Systems Assessment
7. Regulations Assessment
8. Equipment Handling Assessment

### Submissions
- **Total**: 800 submissions
- **Score Distribution**:
  - 15% fail badly (0-49%)
  - 10% barely fail (50-79%)
  - 45% pass well (80-94%)
  - 30% excellent (95-100%)
- **Date Range**: January 1, 2024 to present
- **Random Distribution**: Users and quizzes randomly matched

## Advanced Analytics Impact

This test data will populate:
- **Squadron Performance Overview**: Realistic data for all 4 squadrons
- **Pass Rate Statistics**: Varied performance across squadrons
- **Score Distribution Charts**: Realistic bell curve patterns
- **Temporal Analytics**: Data spread across months for trend analysis
- **User Activity Patterns**: Diverse submission patterns

## Cleanup Process

The cleanup script safely removes:
1. All quiz submissions by test users
2. All scenario submissions by test users  
3. All document submissions by test users
4. All test quizzes (by pattern matching)
5. All test users (by email pattern)

**Safety**: Only targets test data patterns, real data remains protected.

## Identification Patterns

### Test Users
- Email: `*@testdomain.mil`
- Created by: `generate-test-data.js`

### Test Quizzes
- Title: `*Assessment`
- Description: `Comprehensive assessment covering*`

This ensures precise targeting during cleanup operations.