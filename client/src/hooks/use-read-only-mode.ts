import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getUserPermissions, isLeadershipRole } from "@/lib/permissions";

export function useReadOnlyMode() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const permissions = getUserPermissions(user as any);
  const isReadOnly = permissions.isReadOnlyMode;
  const isLeadership = isLeadershipRole(user as any);
  
  const showReadOnlyToast = (action?: string) => {
    const actionText = action || 'perform this action';
    toast({
      title: "Read-Only Mode",
      description: isLeadership 
        ? `Leadership accounts have observation-only access. You cannot ${actionText}.`
        : `Your account is in read-only mode. You cannot ${actionText}.`,
      variant: "destructive",
    });
  };
  
  const checkAndNotify = (action?: string): boolean => {
    if (isReadOnly) {
      showReadOnlyToast(action);
      return false;
    }
    return true;
  };
  
  return {
    isReadOnly,
    isLeadership,
    showReadOnlyToast,
    checkAndNotify,
    permissions
  };
}
