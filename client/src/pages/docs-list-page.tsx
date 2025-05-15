import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DocsListPage() {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Documents - LOADMdocs</title>
        <meta 
          name="description" 
          content="Browse and complete document templates for loadmaster operations." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Documents</h1>
            <p className="text-muted-foreground mt-2">
              Browse and complete document templates for loadmaster operations
            </p>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents?.map((document) => (
                <Card key={document.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl">{document.title}</CardTitle>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        Form
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">
                      {document.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center pt-2 pb-3">
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(document.lastUpdated).toLocaleString()}
                    </div>
                    <Link href={`/documents/${document.id}`}>
                      <Button className="bg-primary hover:bg-primary/90 text-white">
                        Open
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}