import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangleIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WarningPopupProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoHideTime?: number; // Time in ms before auto-hiding
}

export default function WarningPopup({
  open,
  onClose,
  title = "Balance Warning",
  message = "Center of Gravity is at or beyond limits (18-88 degrees). This load configuration may cause aircraft instability.",
  autoHideTime = 10000 // Default 10 seconds
}: WarningPopupProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // When open prop changes, update visibility
    setVisible(open);
    
    // Set up auto-hide timer if needed
    let timer: NodeJS.Timeout | null = null;
    
    if (open && autoHideTime > 0) {
      timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, autoHideTime);
    }
    
    // Clean up timer on component unmount or when open changes
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, autoHideTime, onClose]);
  
  // Don't render if not visible
  if (!visible) return null;
  
  return (
    <Alert variant="destructive" className="mx-auto max-w-lg">
      <AlertTriangleIcon className="h-4 w-4" />
      <div className="flex-1 mr-2">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setVisible(false);
          onClose();
        }}
        className="h-6 w-6"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}