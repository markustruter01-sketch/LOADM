import { useState } from "react";
import { cn } from "@/lib/utils";

interface ToggleButtonProps {
  leftOption: string;
  rightOption: string;
  onToggle: (value: boolean) => void;
  defaultChecked?: boolean;
  className?: string;
}

export function ToggleButton({
  leftOption,
  rightOption,
  onToggle,
  defaultChecked = false,
  className,
}: ToggleButtonProps) {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  const handleChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onToggle(newValue);
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <span className={isChecked ? "text-muted-foreground" : "text-primary font-semibold"}>
        {leftOption}
      </span>
      <div className="relative">
        <input
          type="checkbox"
          id="toggle-view"
          checked={isChecked}
          onChange={handleChange}
          className="sr-only"
        />
        <label
          htmlFor="toggle-view"
          className="block w-14 h-6 rounded-full bg-muted border border-border cursor-pointer relative"
        >
          <span
            className={cn(
              "absolute block w-6 h-6 rounded-full bg-white border-4 border-muted transition-transform duration-200",
              isChecked ? "translate-x-8 border-primary bg-primary" : "translate-x-0"
            )}
          />
        </label>
      </div>
      <span className={isChecked ? "text-primary font-semibold" : "text-muted-foreground"}>
        {rightOption}
      </span>
    </div>
  );
}
