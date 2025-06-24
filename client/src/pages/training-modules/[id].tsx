import { useState } from 'react'
import { useRoute, useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle2, PlayCircle, Download, GraduationCap, Clock, Users, Plane } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from '@tanstack/react-query'

// Function to get aircraft display names
const getAircraftDisplayName = (aircraft: string) => {
  const names = {
    'c17': 'C-17 Globemaster III',
    'c130': 'C-130 Hercules', 
    'kc30a': 'KC30-A MRTT',
    'c27j': 'C-27J Spartan'
  };
  return names[aircraft as keyof typeof names] || aircraft;
};

// Simple placeholder components for content that doesn't exist yet
const TrainingVideoPlayer = ({ title, description }: { title: string; description: string }) => (
  <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-gray-700">
    <div className="text-center">
      <div className="text-4xl mb-4">🎥</div>
      <h4 className="text-lg font-medium mb-2">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
)

export default function TrainingModuleDetail() {
  const [match, params] = useRoute("/training-modules/:id")
  const [, setLocation] = useLocation()
  const [currentTab, setCurrentTab] = useState("reading")
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  if (!match) return null

  const moduleId = params?.id

  // Fetch specific training module from API
  const { data: module, isLoading, error } = useQuery({
    queryKey: ['/api/training-modules', moduleId],
    queryFn: async () => {
      const response = await fetch(`/api/training-modules/${moduleId}`);
      if (!response.ok) throw new Error('Failed to fetch training module');
      return response.json();
    },
    enabled: !!moduleId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p>Loading training module...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Module Not Found</h1>
            <p className="text-gray-400 mb-6">The training module you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/training-modules")} className="bg-orange-500 hover:bg-orange-600">
              Back to Training Modules
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleMarkComplete = () => {
    setProgress(100)
    toast({
      title: "Module Completed!",
      description: `You have successfully completed ${module.title}`,
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/training-modules")}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training Modules
          </Button>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Plane className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{module.title}</h1>
                  <p className="text-gray-400">{getAircraftDisplayName(module.aircraft)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {module.duration || "2 hours"}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {module.instructor || "Loadmaster Instructor"}
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {module.difficulty}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-300 mb-4">{module.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Content */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="reading" className="data-[state=active]:bg-orange-500">Reading</TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-orange-500">Videos</TabsTrigger>
            <TabsTrigger value="interactive" className="data-[state=active]:bg-orange-500">Interactive</TabsTrigger>
            <TabsTrigger value="assessment" className="data-[state=active]:bg-orange-500">Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="reading" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Reading Materials</CardTitle>
                <CardDescription>Comprehensive study materials for this module</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {module.reading_content ? (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white mb-2">{module.title} - Study Guide</h4>
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{module.reading_content}</div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white mb-2">No Reading Materials Available</h4>
                    <p className="text-gray-300 text-sm">Reading materials for this module are being prepared.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Video Content</CardTitle>
                <CardDescription>Interactive video training materials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {module.video_content ? (
                  <div className="space-y-4">
                    <TrainingVideoPlayer 
                      title={`${module.title} - Training Video`}
                      description="Interactive training video with demonstrations"
                    />
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{module.video_content}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white mb-2">No Video Content Available</h4>
                    <p className="text-gray-300 text-sm">Video content for this module is being prepared.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Interactive Exercises</CardTitle>
                <CardDescription>Hands-on training exercises and simulations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {module.interactive_content ? (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Interactive Training Exercises</h4>
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{module.interactive_content}</div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white mb-2">No Interactive Content Available</h4>
                    <p className="text-gray-300 text-sm">Interactive exercises for this module are being prepared.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Assessment</CardTitle>
                <CardDescription>Test your knowledge with module assessments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {module.quiz_content ? (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Module Assessment</h4>
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{module.quiz_content}</div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white mb-2">No Assessment Available</h4>
                    <p className="text-gray-300 text-sm">Assessment content for this module is being prepared.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleMarkComplete} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={progress === 100}
                >
                  {progress === 100 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    "Mark as Complete"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}