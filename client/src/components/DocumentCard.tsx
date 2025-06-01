import { Document } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

// Helper function to get the correct route for each document
function getDocumentRoute(document: Document): string {
  const routeMap: Record<string, string> = {
    "Load Planning Form": "/cargo-manifest#load-planning-form",
    "Passenger/Crew and Cargo Manifest": "/cargo-manifest#cargo-manifest-form",
    "Dangerous Goods Declaration": "/cargo-manifest#dangerous-goods-declaration-form",
    "Weight & Balance Sheet": "/cargo-manifest#weight-balance-sheet-form",
    "Special Handling Form": "/cargo-manifest#special-handling-form",
    "Aircraft Tie-Down Diagram": "/cargo-manifest#tie-down-diagram-form",
    "Cargo Compatibility Checklist": "/cargo-manifest#compatibility-checklist-form",
    "Shoring Requirements Worksheet": "/cargo-manifest#shoring-worksheet-form",
    "Hazard Certification Form": "/cargo-manifest#hazard-certification-form",
    "Aircraft Loading Deviation Request": "/cargo-manifest#loading-deviation-form"
  };
  
  return routeMap[document.title] || "/cargo-manifest";
}

// Helper function to get the form ID for scrolling
function getFormId(title: string): string | null {
  const idMap: Record<string, string> = {
    "Load Planning Form": "load-planning-form",
    "Passenger/Crew and Cargo Manifest": "cargo-manifest-form",
    "Dangerous Goods Declaration": "dangerous-goods-declaration-form",
    "Weight & Balance Sheet": "weight-balance-sheet-form",
    "Special Handling Form": "special-handling-form",
    "Aircraft Tie-Down Diagram": "tie-down-diagram-form",
    "Cargo Compatibility Checklist": "compatibility-checklist-form",
    "Shoring Requirements Worksheet": "shoring-worksheet-form",
    "Hazard Certification Form": "hazard-certification-form",
    "Aircraft Loading Deviation Request": "loading-deviation-form"
  };
  
  return idMap[title] || null;
}

interface DocumentCardProps {
  document: Document;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const formattedDate = formatDistanceToNow(new Date(document.lastUpdated), {
    addSuffix: true,
  });

  const handleDocumentClick = () => {
    const route = getDocumentRoute(document);
    window.location.href = route;
  };

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-card-foreground">
            {document.title}
          </h3>
          <Badge variant="default" className="bg-primary text-primary-foreground">
            {document.type}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          {document.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Last updated: {formattedDate}
          </span>
          <Button 
            onClick={handleDocumentClick}
            className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          >
            Open
          </Button>
        </div>
      </div>
    </div>
  );
}
