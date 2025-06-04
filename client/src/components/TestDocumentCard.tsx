import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface TestDocumentProps {
  title: string;
  description: string;
  type: string;
}

export default function TestDocumentCard({ title, description, type }: TestDocumentProps) {
  const handleEmailDocument = () => {
    console.log('Email button clicked for:', title);
    alert(`Email functionality for: ${title}`);
  };

  const handleOpenDocument = () => {
    console.log('Open button clicked for:', title);
    alert(`Opening: ${title}`);
  };

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-card-foreground">
            {title}
          </h3>
          <Badge variant="default" className="bg-primary text-primary-foreground">
            {type}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          {description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Last updated: just now
          </span>
          <div className="flex gap-2">
            <Button 
              onClick={handleEmailDocument}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Mail className="h-4 w-4" />
              Send
            </Button>
            <Button 
              onClick={handleOpenDocument}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              Open
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}