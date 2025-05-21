import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface TrainingVideoPlayerProps {
  title: string;
  description?: string;
}

export function TrainingVideoPlayer({ title, description }: TrainingVideoPlayerProps) {
  return (
    <Card className="border-gray-800">
      <CardContent className="pt-6">
        <div className="aspect-video w-full mb-4 bg-black rounded-md overflow-hidden">
          <video 
            className="w-full h-full object-cover" 
            controls
            poster="/videos/thumbnail.jpg"
          >
            <source src="/videos/loadmaster_training.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          {description && <p className="text-muted-foreground">{description}</p>}
          <div className="flex items-center text-sm text-muted-foreground mt-4">
            <span className="flex items-center">
              <span className="mr-1">●</span> Professional training material
            </span>
            <span className="mx-2">•</span>
            <span>Digital Dynamics certified content</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TrainingVideoPlayer;