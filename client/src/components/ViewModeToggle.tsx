import React from 'react';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { Cube, Grid2X2 } from 'lucide-react';

interface ViewModeToggleProps {
  view: '2d' | '3d';
  onChange: (view: '2d' | '3d') => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ view, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">View Mode:</span>
      <ToggleGroup type="single" value={view} onValueChange={(value) => onChange(value as '2d' | '3d')}>
        <ToggleGroupItem value="2d" aria-label="2D View">
          <Grid2X2 className="h-4 w-4 mr-1" />
          <span>2D</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="3d" aria-label="3D View">
          <Cube className="h-4 w-4 mr-1" />
          <span>3D</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ViewModeToggle;