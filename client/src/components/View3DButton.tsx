import React from 'react';
import { Button } from "@/components/ui/button";
import { Box } from 'lucide-react';
import { useLocation } from 'wouter';

interface View3DButtonProps {
  aircraftId: string;
  className?: string;
}

const View3DButton: React.FC<View3DButtonProps> = ({ aircraftId, className = '' }) => {
  const [_, navigate] = useLocation();
  
  const handleClick = () => {
    navigate(`/cargo-3d-view/${aircraftId}`);
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`flex items-center gap-1 ${className}`}
    >
      <Box className="h-4 w-4" />
      <span>View in 3D</span>
    </Button>
  );
};

export default View3DButton;