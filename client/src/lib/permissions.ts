// Permission system for different license types
export type LicenseType = 'loadmaster' | 'instructor' | 'superadmin' | 'readonly';

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
}

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
    };
  }

  const role = user.role;
  const licenseType = user.licenseType || user.userRole || role;

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
      };
  }
}

export function canPerformAction(user: User | null, action: keyof PermissionCheck): boolean {
  const permissions = getUserPermissions(user);
  return permissions[action];
}

export function requiresPermission(user: User | null, action: keyof PermissionCheck): { allowed: boolean; message: string } {
  const allowed = canPerformAction(user, action);
  
  if (!allowed) {
    const actionMessages = {
      canEdit: 'edit content',
      canCreate: 'create content',
      canDelete: 'delete content',
      canSubmit: 'submit assessments',
      canViewAdminPanel: 'access admin panel',
      canManageUsers: 'manage users',
      canManageLicenses: 'manage licenses',
    };
    
    return {
      allowed: false,
      message: actionMessages[action] || 'perform this action'
    };
  }
  
  return { allowed: true, message: '' };
}