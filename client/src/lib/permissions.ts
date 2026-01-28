// Permission system for different license types
export type LicenseType = 'loadmaster' | 'instructor' | 'superadmin' | 'readonly' | 'leadership';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  licenseType?: LicenseType;
  isFirstLogin?: boolean;
  hasCompletedOnboarding?: boolean;
}

export interface PermissionCheck {
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canViewAdminPanel: boolean;
  canManageUsers: boolean;
  canManageLicenses: boolean;
  isReadOnlyMode: boolean;
  isHiddenFromReports: boolean;
}

/**
 * PERMISSION MATRIX
 * 
 * License Type    | View | Edit | Create | Delete | Submit | Admin Panel | Manage Users | Manage Licenses | Read-Only | Hidden
 * ---------------|------|------|--------|--------|--------|-------------|--------------|-----------------|-----------|--------
 * readonly       |  ✓   |  ✗   |   ✗    |   ✗    |   ✗    |     ✗       |      ✗       |       ✗         |     ✓     |   ✗
 * loadmaster     |  ✓   |  ✗   |   ✗    |   ✗    |   ✓    |     ✗       |      ✗       |       ✗         |     ✗     |   ✗
 * instructor     |  ✓   |  ✓   |   ✓    |   ✓    |   ✓    |     ✓       |      ✗       |       ✗         |     ✗     |   ✗
 * leadership     |  ✓   |  ✗   |   ✗    |   ✗    |   ✗    |     ✓       |      ✗       |       ✗         |     ✓     |   ✓
 * superadmin     |  ✓   |  ✓   |   ✓    |   ✓    |   ✓    |     ✓       |      ✓       |       ✓         |     ✗     |   ✗
 * 
 * Access Details:
 * - readonly: Can view all content, documents, quizzes, scenarios but cannot interact or submit
 * - loadmaster: Can submit quizzes and scenarios but cannot create/edit content
 * - instructor: Can create/edit training content, manage scenarios, view admin dashboard
 * - leadership: Same VIEW access as instructor but READ-ONLY mode - hidden from instructor views, reports, and analytics
 * - superadmin: Full system access including user and license management
 */

export function getUserPermissions(user: User | null): PermissionCheck {
  if (!user) {
    return {
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canSubmit: false,
      canViewAdminPanel: false,
      canManageUsers: false,
      canManageLicenses: false,
      isReadOnlyMode: true,
      isHiddenFromReports: false,
    };
  }

  const role = user.role;
  const licenseType = user.licenseType || role;

  switch (licenseType) {
    case 'readonly':
      return {
        canEdit: false,
        canCreate: false,
        canDelete: false,
        canSubmit: false,
        canViewAdminPanel: false,
        canManageUsers: false,
        canManageLicenses: false,
        isReadOnlyMode: true,
        isHiddenFromReports: false,
      };
    
    case 'loadmaster':
      return {
        canEdit: false,
        canCreate: false,
        canDelete: false,
        canSubmit: true,
        canViewAdminPanel: false,
        canManageUsers: false,
        canManageLicenses: false,
        isReadOnlyMode: false,
        isHiddenFromReports: false,
      };
    
    case 'instructor':
      return {
        canEdit: true,
        canCreate: true,
        canDelete: true,
        canSubmit: true,
        canViewAdminPanel: true,
        canManageUsers: false,
        canManageLicenses: false,
        isReadOnlyMode: false,
        isHiddenFromReports: false,
      };
    
    case 'leadership':
      return {
        canEdit: false,
        canCreate: false,
        canDelete: false,
        canSubmit: false,
        canViewAdminPanel: true,
        canManageUsers: false,
        canManageLicenses: false,
        isReadOnlyMode: true,
        isHiddenFromReports: true,
      };
    
    case 'superadmin':
      return {
        canEdit: true,
        canCreate: true,
        canDelete: true,
        canSubmit: true,
        canViewAdminPanel: true,
        canManageUsers: true,
        canManageLicenses: true,
        isReadOnlyMode: false,
        isHiddenFromReports: false,
      };
    
    default:
      return {
        canEdit: false,
        canCreate: false,
        canDelete: false,
        canSubmit: false,
        canViewAdminPanel: false,
        canManageUsers: false,
        canManageLicenses: false,
        isReadOnlyMode: true,
        isHiddenFromReports: false,
      };
  }
}

export function isLeadershipRole(user: User | null): boolean {
  if (!user) return false;
  const licenseType = user.licenseType || user.role;
  return licenseType === 'leadership';
}

export function canPerformAction(user: User | null, action: keyof PermissionCheck): boolean {
  const permissions = getUserPermissions(user);
  return permissions[action];
}

export function requiresPermission(user: User | null, action: keyof PermissionCheck): { allowed: boolean; message: string } {
  const allowed = canPerformAction(user, action);
  
  if (!allowed) {
    const actionMessages: Record<keyof PermissionCheck, string> = {
      canEdit: 'edit content',
      canCreate: 'create content',
      canDelete: 'delete content',
      canSubmit: 'submit assessments',
      canViewAdminPanel: 'access admin panel',
      canManageUsers: 'manage users',
      canManageLicenses: 'manage licenses',
      isReadOnlyMode: 'interact (read-only mode)',
      isHiddenFromReports: 'appear in reports',
    };
    
    return {
      allowed: false,
      message: actionMessages[action] || 'perform this action'
    };
  }
  
  return { allowed: true, message: '' };
}

// Hook for using permissions in components
export function usePermissions(user: User | null) {
  return {
    permissions: getUserPermissions(user),
    canPerformAction: (action: keyof PermissionCheck) => canPerformAction(user, action),
    requiresPermission: (action: keyof PermissionCheck) => requiresPermission(user, action)
  };
}