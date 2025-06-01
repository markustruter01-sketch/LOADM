
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

export default function TeachingMaterials() {
  const resources = [
    {
      id: 1,
      title: "Instructor Guide - Scenario Creation",
      description: "Complete guide for creating effective training scenarios",
      type: "PDF",
      size: "2.5 MB"
    },
    {
      id: 2,
      title: "Assessment Rubrics",
      description: "Standardized rubrics for evaluating student performance",
      type: "DOCX",
      size: "1.2 MB"
    },
    {
      id: 3,
      title: "Safety Procedures Manual",
      description: "Updated safety protocols for training environments",
      type: "PDF",
      size: "3.8 MB"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Teaching Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {resource.title}
              </CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{resource.type}</span>
                <span>{resource.size}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
