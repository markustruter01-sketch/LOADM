import { Document } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface DocumentCardProps {
  document: Document;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const formattedDate = formatDistanceToNow(new Date(document.lastUpdated), {
    addSuffix: true,
  });

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
          <Link href={getDocumentRoute(document)} onClick={() => {
            // Handle scrolling after navigation
            setTimeout(() => {
              const formId = getFormId(document.title);
              if (formId) {
                const element = window.document.getElementById(formId);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }, 200);
          }}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
              Open
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
