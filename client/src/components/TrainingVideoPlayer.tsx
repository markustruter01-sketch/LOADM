import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface TrainingVideoPlayerProps {
  title: string;
  description?: string;
}

export function TrainingVideoPlayer({ title, description }: TrainingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  const videoUrl = "/videos/training_video.mp4";
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          setVideoError(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  useEffect(() => {
    const videoElement = videoRef.current;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => setVideoError(true);
    
    if (videoElement) {
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
      videoElement.addEventListener('error', handleError);
    }
    
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('error', handleError);
      }
    };
  }, []);
  
  return (
    <Card className="border-gray-800">
      <CardContent className="pt-6">
        <div className="aspect-video w-full mb-4 bg-black rounded-md overflow-hidden relative">
          <video 
            ref={videoRef}
            className="w-full h-full object-cover" 
            controls={false}
            preload="metadata"
            onError={() => setVideoError(true)}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {videoError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 p-4 text-center">
              <p className="text-white mb-2">This video is currently unavailable.</p>
              <p className="text-sm text-gray-400">The training video will be available in your production environment.</p>
            </div>
          ) : (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-black/50 text-white hover:bg-black/70 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-black/50 text-white hover:bg-black/70 rounded-full"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          )}
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