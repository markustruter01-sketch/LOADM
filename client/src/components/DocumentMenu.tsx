import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useEffect, useState } from "react";

interface DocumentCardProps {
  title: string;
  description: string;
  lastUpdated: string;
  path: string;
}

function DocumentCard({ title, description, lastUpdated, path }: DocumentCardProps) {
  // Handle navigation and smooth scrolling
  const handleClick = () => {
    if (path.includes('#')) {
      // If the path contains a hash, it's an existing form we want to scroll to
      const elementId = path.split('#')[1];
      // Use setTimeout to allow navigation to complete
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // For other documents that will need their own form sections
      // Create a standard form ID format based on the document title
      const formId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-form';
      
      // Store this in sessionStorage to be checked after navigation
      sessionStorage.setItem('scrollToFormId', formId);
    }
  };

  return (
    <Card className="bg-card hover:bg-card/90 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg text-foreground">{title}</CardTitle>
          <Badge variant="secondary" className="bg-primary text-white font-normal">Form</Badge>
        </div>
        <CardDescription className="text-muted-foreground text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
      </CardContent>
      <CardFooter className="flex justify-end pt-2">
        <Link href={path} onClick={handleClick}>
          <Button className="bg-primary hover:bg-primary/90 text-white">Open</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function DocumentMenu() {
  const [currentTime, setCurrentTime] = useState("2 minutes ago");
  
  useEffect(() => {
    // This is just to simulate real-time updates - in a real app this would be from the database
    const interval = setInterval(() => {
      const minutes = Math.floor(Math.random() * 5) + 1;
      setCurrentTime(`${minutes} minutes ago`);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const documents = [
    {
      id: 1,
      title: "Load Planning Form",
      description: "Complete detailed load planning documentation for cargo aircraft operations.",
      path: "/airframe?tab=load-planning",
    },
    {
      id: 4,
      title: "Weight & Balance Sheet",
      description: "Calculate and document aircraft weight distribution and balance.",
      path: "/airframe?tab=load-planning",
    },
    {
      id: 6,
      title: "Aircraft Tie-Down Diagram",
      description: "Detailed cargo restraint planning diagram with tie-down points and calculations.",
      path: "/airframe?tab=load-planning",
    },
    {
      id: 9,
      title: "Hazard Certification Form",
      description: "Certification of hazardous materials for air transport compliance.",
      path: "/airframe?tab=load-planning",
    },
    {
      id: 10,
      title: "Aircraft Loading Deviation Request",
      description: "Request and document approval for non-standard loading configurations.",
      path: "/airframe?tab=load-planning",
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">Documents</h2>
        {/* No view all button needed as this is now the documents page */}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            title={doc.title}
            description={doc.description}
            lastUpdated={currentTime}
            path={doc.path}
          />
        ))}
      </div>
    </div>
  );
}