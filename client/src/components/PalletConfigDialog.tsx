import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Pallet {
  id: number;
  position: { x: number; y: number };
  location: "cargo" | "configure";
  weight: number | null;
  size: { width: number; height: number };
  cargoType?: "C" | "DG";
  cargoCategory?: string;
  dgClass?: string;
  positionLabel?: string;
}

interface PalletConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  palletId: number | null;
  position: string;
  weight: string;
  cargoType: "C" | "DG";
  cargoCategory: string;
  dgClass: string;
  isDangerousGoods: boolean;
  maxPalletWeight: number;
  /** Unit shown on the weight field (defaults to kg). */
  unitLabel?: string;
  onConfirm: (data: {
    id: number;
    weight: number | null;
    cargoType: "C" | "DG";
    cargoCategory: string;
    dgClass: string;
    position: string;
  }) => void;
  onCancel: () => void;
  onWeightChange: (value: string) => void;
  onCargoTypeChange: (value: "C" | "DG") => void;
  onCategoryChange: (value: string) => void;
  onDgClassChange: (value: string) => void;
  onDangerousGoodsChange: (checked: boolean) => void;
}

export default function PalletConfigDialog({
  open,
  onOpenChange,
  palletId,
  position,
  weight,
  cargoType,
  cargoCategory,
  dgClass,
  isDangerousGoods,
  maxPalletWeight,
  unitLabel = 'kg',
  onConfirm,
  onCancel,
  onWeightChange,
  onCargoTypeChange,
  onCategoryChange,
  onDgClassChange,
  onDangerousGoodsChange
}: PalletConfigDialogProps) {
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleConfirm = () => {
    if (!palletId) return;
    
    setConfirmLoading(true);
    
    // Convert weight string to number, or null if empty
    const parsed = parseFloat(weight);
    const weightValue = weight && !Number.isNaN(parsed) ? Math.round(parsed) : null;
    
    onConfirm({
      id: palletId,
      weight: weightValue,
      cargoType,
      cargoCategory,
      dgClass,
      position
    });
    
    setConfirmLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Pallet {position}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Weight Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weight" className="text-right">
              Weight ({unitLabel})
            </Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => onWeightChange(e.target.value)}
              className="col-span-3"
              placeholder={`Max: ${maxPalletWeight.toLocaleString()} ${unitLabel}`}
              min="0"
              max={maxPalletWeight}
            />
          </div>
          
          {/* Cargo Type Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cargo-type" className="text-right">
              Cargo Type
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Checkbox
                id="dg-checkbox"
                checked={isDangerousGoods}
                onCheckedChange={(checked) => onDangerousGoodsChange(!!checked)}
              />
              <label
                htmlFor="dg-checkbox"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Dangerous Goods
              </label>
            </div>
          </div>
          
          {/* Cargo Category Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select 
              value={cargoCategory} 
              onValueChange={onCategoryChange}
            >
              <SelectTrigger id="category" className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pax">Passenger Bags</SelectItem>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="medical">Medical Equipment</SelectItem>
                <SelectItem value="perishable">Perishable</SelectItem>
                <SelectItem value="general">General Cargo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* DG Class Input - Only enabled for DG type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dg-class" className="text-right">
              DG Class
            </Label>
            <Select 
              value={dgClass} 
              onValueChange={onDgClassChange}
              disabled={!isDangerousGoods}
            >
              <SelectTrigger id="dg-class" className="col-span-3">
                <SelectValue placeholder="Select DG class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Class 1 - Explosives</SelectItem>
                <SelectItem value="2">Class 2 - Gases</SelectItem>
                <SelectItem value="3">Class 3 - Flammable Liquids</SelectItem>
                <SelectItem value="4">Class 4 - Flammable Solids</SelectItem>
                <SelectItem value="5">Class 5 - Oxidizing Substances</SelectItem>
                <SelectItem value="6">Class 6 - Toxic Substances</SelectItem>
                <SelectItem value="7">Class 7 - Radioactive Material</SelectItem>
                <SelectItem value="8">Class 8 - Corrosives</SelectItem>
                <SelectItem value="9">Class 9 - Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={confirmLoading}>
            {confirmLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}