# LOADMworkflow Permission Matrix

## Overview
The LOADMworkflow platform implements a comprehensive role-based permission system with four distinct license types, each with specific access levels to ensure appropriate security and functionality for military training operations.

## License Types & Permissions

### 1. Readonly License (`readonly`)
**Purpose**: View-only access for personnel who need to review content but not interact with assessments

**Permissions**:
- ✅ **View**: All content, documents, quizzes, scenarios, training modules
- ✅ **Browse**: Navigate through all application sections
- ✅ **Access**: Documents, PDFs, training materials
- ❌ **Edit**: Cannot modify any content
- ❌ **Create**: Cannot create new content
- ❌ **Submit**: Cannot submit quizzes or scenarios
- ❌ **Admin**: No administrative access

**Use Cases**:
- Senior staff reviewing training materials
- Quality assurance personnel
- External auditors or inspectors
- Personnel requiring content review without assessment participation

### 2. Loadmaster License (`loadmaster`)
**Purpose**: Standard operational personnel who participate in training and assessments

**Permissions**:
- ✅ **View**: All content, documents, quizzes, scenarios
- ✅ **Submit**: Quizzes, scenarios, and assessments
- ✅ **Complete**: Training modules and certification requirements
- ❌ **Edit**: Cannot modify existing content
- ❌ **Create**: Cannot create new content
- ❌ **Admin**: No administrative access

**Use Cases**:
- Active loadmaster personnel
- Students in training programs
- Personnel completing certification requirements
- Operational staff participating in assessments

### 3. Instructor License (`instructor`)
**Purpose**: Training personnel who create and manage educational content

**Permissions**:
- ✅ **View**: All content and administrative dashboards
- ✅ **Edit**: Training modules, quizzes, scenarios
- ✅ **Create**: New training content, assessments
- ✅ **Delete**: Content they have created
- ✅ **Submit**: Participate in assessments
- ✅ **Admin Panel**: Access to instructor dashboard
- ✅ **Review**: Student submissions and progress
- ❌ **Manage Users**: Cannot create/delete user accounts
- ❌ **Manage Licenses**: Cannot manage licensing system

**Use Cases**:
- Training instructors
- Course developers
- Assessment creators
- Content reviewers

### 4. Superadmin License (`superadmin`)
**Purpose**: Full system administration and management

**Permissions**:
- ✅ **Full Access**: All system functionality
- ✅ **User Management**: Create, edit, delete user accounts
- ✅ **License Management**: Full licensing system control
- ✅ **System Configuration**: Application settings and configuration
- ✅ **Data Management**: Database operations and maintenance
- ✅ **Audit Access**: Complete system audit capabilities

**Use Cases**:
- System administrators
- IT management personnel
- Senior leadership with full oversight requirements
- Technical support staff

## Permission Implementation

### Frontend Permission Checks
```typescript
// Check if user can perform specific action
const canSubmit = checkPermission('canSubmit');
if (!canSubmit) {
  showPermissionError('submit assessments');
  return;
}
```

### Backend Validation
All API endpoints implement role-based validation to ensure permissions are enforced server-side as well as client-side.

### Permission Dialog System
When users with insufficient permissions attempt restricted actions, they receive clear feedback through the Permission Dialog system:

- **Title**: "Access Restricted"
- **Message**: Specific explanation of limitation
- **Action**: Clear guidance on how to proceed
- **License Info**: Details about current license type

## Security Considerations

### Defense in Depth
1. **Client-side validation**: Immediate user feedback
2. **Server-side enforcement**: Security against tampering
3. **Database constraints**: Final layer of protection
4. **Session management**: Secure authentication handling

### Audit Trail
All permission-related actions are logged for security auditing and compliance purposes.

## License Type Usage Guidelines

### When to Use Readonly
- Personnel need content review without assessment participation
- External auditors or quality assurance reviewers
- Senior staff monitoring training materials
- Situations requiring view-only access for security reasons

### When to Use Loadmaster
- Active operational personnel
- Students in training programs
- Personnel completing certifications
- Standard assessment participants

### When to Use Instructor
- Training content creators
- Course developers
- Assessment designers
- Personnel managing student progress

### When to Use Superadmin
- System administrators
- IT management personnel
- Senior leadership requiring full oversight
- Technical support staff

## Migration and Compatibility

The permission system is designed to be:
- **Backwards compatible**: Existing users maintain their current access levels
- **Scalable**: Easy to add new permission types as needed
- **Flexible**: Permissions can be adjusted without code changes
- **Secure**: All changes require proper authentication and authorization

## Support and Training

For questions about permission levels or license type assignments, contact your system administrator or refer to the user training documentation.