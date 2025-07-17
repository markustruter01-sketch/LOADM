import { useState } from 'react';
import { useIsolatedAuth } from '../auth-isolated/auth-context';
import { getUserPermissions, canPerformAction, requiresPermission, type PermissionCheck } from '../lib/permissions';

export function usePermissions() {
  const { user } = useIsolatedAuth();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionAction, setPermissionAction] = useState('');

  const permissions = getUserPermissions(user);

  const checkPermission = (action: keyof PermissionCheck): boolean => {
    return canPerformAction(user, action);
  };

  const requirePermission = (action: keyof PermissionCheck): { allowed: boolean; message: string } => {
    return requiresPermission(user, action);
  };

  const showPermissionError = (action: string) => {
    setPermissionAction(action);
    setShowPermissionDialog(true);
  };

  const isReadOnly = user?.role === 'readonly';

  return {
    user,
    permissions,
    checkPermission,
    requirePermission,
    showPermissionError,
    showPermissionDialog,
    setShowPermissionDialog,
    permissionAction,
    isReadOnly
  };
}