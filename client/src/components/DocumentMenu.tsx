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
  // Handle smooth scrolling for anchor links
  const handleClick = () => {
    if (path.includes('#')) {
      const elementId = path.split('#')[1];
      // Use setTimeout to allow navigation to complete
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
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
      path: "/documents/load-planning",
    },
    {
      id: 2,
      title: "Passenger/Crew and Cargo Manifest",
      description: "Generate and complete detailed cargo manifests for all shipments.",
      path: "/cargo-manifest#cargo-manifest-form",
    },
    {
      id: 3,
      title: "Dangerous Goods Declaration",
      description: "Complete DG documentation for hazardous materials transportation.",
      path: "/documents/dangerous-goods",
    },
    {
      id: 4,
      title: "Weight & Balance Sheet",
      description: "Calculate and document aircraft weight distribution and balance.",
      path: "/documents/weight-balance",
    },
    {
      id: 5,
      title: "Cargo Floor Loading Plan",
      description: "Detailed diagram and specifications for floor-loaded cargo.",
      path: "/documents/floor-loading",
    },
    {
      id: 6,
      title: "Pallet Build-Up Form",
      description: "Documentation for the configuration and build-up of air cargo pallets.",
      path: "/documents/pallet-build",
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">Documents</h2>
        <Link href="/documents">
          <Button variant="link" className="text-primary">
            View All
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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