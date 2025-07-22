import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock } from "lucide-react";

interface PermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: string;
  feature?: string;
  title?: string;
  description?: string;
}

export function PermissionDialog({ 
  isOpen, 
  onClose, 
  action, 
  feature,
  title = "Access Restricted",
  description 
}: PermissionDialogProps) {
  const defaultDescription = `You don't have permission to ${action} under your current license. Please contact your administrator to upgrade your access level.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <div className="text-sm text-orange-800">
            <p className="font-medium">Read-Only License</p>
            <p>Your current license allows viewing content only.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Understood
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}