import { Package2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TemplatePalletConfigProps {
  maxPallets: number;
  aircraftName: string;
  onTemplateDragStart: (e: React.DragEvent) => void;
}

export default function TemplatePalletConfig({
  maxPallets,
  aircraftName,
  onTemplateDragStart
}: TemplatePalletConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <Package2 className="h-5 w-5 mr-2 text-primary" />
          Configure Pallets
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (Max: {maxPallets})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-md p-4 space-y-2">
          <h3 className="text-sm font-medium">Template Pallet</h3>
          <p className="text-xs text-muted-foreground">
            Drag this template pallet to the cargo area to create new pallets. You can add up to {maxPallets} pallets for the {aircraftName}.
          </p>
          <div 
            draggable 
            onDragStart={onTemplateDragStart}
            className="h-20 bg-orange-800/50 border-2 border-orange-500 rounded mt-2 cursor-move flex items-center justify-center"
          >
            <div className="text-center">
              <span className="text-white font-medium">Drag to add</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}