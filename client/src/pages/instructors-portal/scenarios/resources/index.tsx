
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, Video } from "lucide-react";

export default function ScenarioResources() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Scenario Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates
            </CardTitle>
            <CardDescription>Pre-built scenario templates</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Browse Templates</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Media Library
            </CardTitle>
            <CardDescription>Images and diagrams for scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">View Media</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Resources
            </CardTitle>
            <CardDescription>Training videos and demonstrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Watch Videos</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
