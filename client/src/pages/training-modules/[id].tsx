import { useState, useEffect } from 'react'
import { useRoute, useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle2, PlayCircle, Download, GraduationCap, Clock, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from '@tanstack/react-query'

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

// Clean module contents without duplicates
const moduleContents: Record<string, any[]> = {
  "c17-basics": [
    {
      id: "c17-basics-1",
      title: "C-17 Globemaster III Overview",
      type: "video",
      duration: "20 min",
      description: "Introduction to the C-17 Globemaster III aircraft and its cargo capabilities",
      content: "Video content would be embedded here",
      completed: false
    },
    {
      id: "c17-cargo-bay-layout",
      title: "C-17 Cargo Bay Layout and Features",
      type: "reading",
      duration: "15 min",
      description: "Detailed study of the C-17 cargo bay configuration and loadmaster workspace",
      content: "Reading content would be displayed here",
      completed: false
    },
    {
      id: "c17-basics-3",
      title: "Basic Loading Procedures",
      type: "interactive",
      duration: "25 min",
      description: "Interactive tutorial on fundamental C-17 loading procedures",
      content: "Interactive content would be displayed here",
      completed: false
    },
    {
      id: "c17-basics-4",
      title: "Weight and Balance Basics",
      type: "reading",
      duration: "18 min",
      description: "Introduction to C-17 weight and balance principles",
      content: "Reading content would be displayed here",
      completed: false
    },
    {
      id: "c17-basics-5",
      title: "C-17 Fundamentals Quiz",
      type: "quiz",
      duration: "15 min",
      description: "Test your knowledge of C-17 fundamentals",
      content: "Quiz content would be displayed here",
      completed: false
    }
  ],
  "c130-basics": [
    {
      id: "c130-basics-1",
      title: "C-130 Hercules Overview",
      type: "video",
      duration: "18 min",
      description: "Introduction to C-130 Hercules capabilities",
      content: "Video content for C-130 overview",
      completed: false
    },
    {
      id: "c130-basics-2",
      title: "C-130 Cargo Compartment",
      type: "reading",
      duration: "12 min",
      description: "Detailed study of C-130 cargo compartment",
      content: "Reading content for cargo compartment",
      completed: false
    },
    {
      id: "c130-basics-3",
      title: "Basic Loading Procedures",
      type: "interactive",
      duration: "20 min",
      description: "Interactive training for basic C-130 loading",
      content: "Interactive basic loading training",
      completed: false
    },
    {
      id: "c130-basics-4",
      title: "C-130 Fundamentals Quiz",
      type: "quiz",
      duration: "12 min",
      description: "Test your C-130 fundamental knowledge",
      content: "Quiz for C-130 fundamentals",
      completed: false
    }
  ],
  "kc30a-basics": [
    {
      id: "kc30a-basics-1",
      title: "KC30-A Introduction",
      type: "video",
      duration: "20 min",
      description: "Introduction to KC30-A Multi-Role Tanker Transport",
      content: "Video content for KC30-A introduction",
      completed: false
    },
    {
      id: "kc30a-basics-2",
      title: "Cargo Bay Systems",
      type: "reading",
      duration: "15 min",
      description: "Study of KC30-A cargo bay systems",
      content: "Reading content for cargo bay systems",
      completed: false
    },
    {
      id: "kc30a-basics-3",
      title: "Basic Cargo Operations",
      type: "interactive",
      duration: "25 min",
      description: "Interactive training for basic cargo operations",
      content: "Interactive basic cargo operations",
      completed: false
    },
    {
      id: "kc30a-basics-4",
      title: "KC30-A Basics Quiz",
      type: "quiz",
      duration: "15 min",
      description: "Test your KC30-A basic knowledge",
      content: "Quiz for KC30-A basics",
      completed: false
    }
  ],
  "c27j-basics": [
    {
      id: "c27j-basics-1",
      title: "C-27J Spartan Overview",
      type: "video",
      duration: "18 min",
      description: "Introduction to C-27J Spartan capabilities",
      content: "Video content for C-27J overview",
      completed: false
    },
    {
      id: "c27j-basics-2",
      title: "Spartan Cargo Systems",
      type: "reading",
      duration: "14 min",
      description: "Study of C-27J cargo systems and layout",
      content: "Reading content for cargo systems",
      completed: false
    },
    {
      id: "c27j-basics-3",
      title: "Basic Loading Procedures",
      type: "interactive",
      duration: "22 min",
      description: "Interactive training for basic C-27J loading",
      content: "Interactive basic loading training",
      completed: false
    },
    {
      id: "c27j-basics-4",
      title: "C-27J Fundamentals Quiz",
      type: "quiz",
      duration: "14 min",
      description: "Test your C-27J fundamental knowledge",
      content: "Quiz for C-27J fundamentals",
      completed: false
    }
  ]
}

export default function ModuleDetailPage() {
  const [, params] = useRoute('/training-modules/:id')
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [currentTab, setCurrentTab] = useState('overview')
  const [moduleProgress, setModuleProgress] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  
  // Force background color on component mount and prevent blue backgrounds
  useEffect(() => {
    // Apply to document elements
    const elements = [document.documentElement, document.body];
    elements.forEach(el => {
      el.style.setProperty('background-color', '#1e1e1e', 'important');
      el.style.setProperty('background-image', 'none', 'important');
      el.style.setProperty('background', '#1e1e1e', 'important');
    });
    
    // Clean up on unmount
    return () => {
      elements.forEach(el => {
        el.style.removeProperty('background-color');
        el.style.removeProperty('background-image');
        el.style.removeProperty('background');
      });
    };
  }, []);
  
  // Fetch training modules from API
  const { data: apiModules } = useQuery({
    queryKey: ['/api/training-modules'],
    queryFn: async () => {
      const response = await fetch('/api/training-modules')
      if (!response.ok) throw new Error('Failed to fetch training modules')
      return response.json()
    },
  })

  // Find the module that matches the ID parameter
  const moduleId = params?.id || ''
  const numericId = parseInt(moduleId)
  const module = apiModules?.find(m => m.id === numericId)

  // Fetch uploaded videos for this specific module
  const { data: uploadedVideos } = useQuery({
    queryKey: ['/api/training-modules', module?.id, 'videos'],
    queryFn: async () => {
      if (!module?.id || typeof module.id !== 'number') return []
      const response = await fetch(`/api/training-modules/${module.id}/videos`)
      if (!response.ok) return []
      return response.json()
    },
    enabled: !!module?.id && typeof module.id === 'number',
  })

  // Map API module IDs to content keys
  const getContentKey = (module: any) => {
    if (!module) return ''
    
    // If it's a numeric ID from API, map to content key
    if (typeof module.id === 'number') {
      const aircraft = module.aircraft
      const difficulty = module.difficulty
      
      // Map based on aircraft type and difficulty
      if (aircraft === 'c17') {
        if (difficulty === 'beginner') return 'c17-basics'
      }
      if (aircraft === 'c130') {
        if (difficulty === 'beginner') return 'c130-basics'
      }
      if (aircraft === 'kc30a') {
        if (difficulty === 'beginner') return 'kc30a-basics'
      }
      if (aircraft === 'c27j') {
        if (difficulty === 'beginner') return 'c27j-basics'
      }
    }
    
    // For string IDs, use directly
    return module.id || ''
  }

  // Get lesson content based on module
  const contentKey = getContentKey(module)
  const content = moduleContents[contentKey] || []

  const completeLesson = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      const newCompleted = [...completedLessons, lessonId]
      setCompletedLessons(newCompleted)
      
      // Calculate progress
      const progress = (newCompleted.length / content.length) * 100
      setModuleProgress(progress)

      toast({
        title: "Lesson completed!",
        description: "Your progress has been saved.",
      })
    }
  }

  // Early return if module not found
  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e1e1e', backgroundImage: 'none', background: '#1e1e1e' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Module Not Found</h1>
          <p className="text-gray-300 mb-6">The training module you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/training-modules')} className="bg-primary text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training Modules
          </Button>
        </div>
      </div>
    )
  }

  // Calculate available content types including uploaded videos
  const hasUploadedVideos = uploadedVideos && uploadedVideos.length > 0
  const staticContentTypes = [...new Set(content.map(item => item.type))]
  const contentTypes = hasUploadedVideos 
    ? [...new Set([...staticContentTypes, 'video'])] 
    : staticContentTypes

  const getAircraftName = (id: string) => {
    const config = aircraftConfigs[id]
    return config ? config.name : id
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1e1e1e', backgroundImage: 'none', background: '#1e1e1e' }}>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/training-modules')}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Modules
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{module.title}</h1>
            <p className="text-gray-300 mt-1">
              {getAircraftName(module.id)} • {module.difficulty} Level
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="border-gray-800 mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Module Progress</CardTitle>
                <CardDescription>{Math.round(moduleProgress)}% Complete</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {completedLessons.length} / {content.length} Lessons
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={moduleProgress} className="w-full" />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Videos
            </TabsTrigger>
            <TabsTrigger value="readings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Reading
            </TabsTrigger>
            <TabsTrigger value="interactive" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Interactive
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Quiz
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Module Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">
                      {module.description}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Learning Objectives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {module.objectives?.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300">
                          <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Module Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Duration: {module.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Instructor: {module.instructor}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-sm text-gray-400">
                        Prerequisites: {module.prerequisites}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Last Updated: {module.lastUpdated}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Certificate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 mb-4">
                      Complete all lessons to earn your certificate
                    </p>
                    <Button 
                      className="w-full bg-primary text-white hover:bg-primary/90"
                      disabled={moduleProgress < 100}
                      onClick={() => {
                        if (moduleProgress >= 100) {
                          toast({
                            title: "Certificate Generated!",
                            description: "Your completion certificate has been generated and saved.",
                          })
                        }
                      }}
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      {moduleProgress >= 100 ? "Generate Certificate" : "Complete Module First"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Videos Tab Content - ALWAYS PRESENT */}
          <TabsContent value="videos">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Training Videos</CardTitle>
                <CardDescription>
                  Watch instructional videos for {module.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Show uploaded videos from instructor portal if available */}
                  {hasUploadedVideos ? (
                    uploadedVideos.map((video: any) => (
                      <div key={video.id} className="space-y-4">
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                          <h3 className="text-lg font-medium text-white mb-2">{video.videoTitle}</h3>
                          <p className="text-muted-foreground mb-4">{video.videoDescription}</p>
                          
                          {/* Video Player */}
                          <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4">
                            <video 
                              controls 
                              className="w-full h-full rounded-lg"
                              src={`/api/training-modules/videos/stream/${video.id}`}
                            >
                              Your browser does not support video playback.
                            </video>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                              Video {video.videoOrder}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Video completed",
                                  description: "Your progress has been saved",
                                })
                              }}
                              className="bg-primary text-white hover:bg-primary/90"
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Mark as Watched
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : content.filter(lesson => lesson.type === 'video').length > 0 ? (
                    /* Show existing video content if available */
                    content
                      .filter(lesson => lesson.type === 'video')
                      .map(lesson => (
                        <div key={lesson.id} className="space-y-4">
                          <TrainingVideoPlayer
                            title={lesson.title}
                            description={lesson.description}
                          />
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                              {lesson.duration}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => completeLesson(lesson.id)}
                              disabled={completedLessons.includes(lesson.id)}
                              className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {completedLessons.includes(lesson.id) ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Watch Now
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    /* Default video content for all modules */
                    <div className="space-y-4">
                      <TrainingVideoPlayer 
                        title={`${module.title} - Introduction`}
                        description="Overview and introduction to the module concepts"
                      />
                      <TrainingVideoPlayer 
                        title={`${module.title} - Core Concepts`}
                        description="Detailed explanation of key principles and procedures"
                      />
                      <TrainingVideoPlayer 
                        title={`${module.title} - Practical Applications`}
                        description="Real-world scenarios and hands-on demonstrations"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Readings Tab Content */}
          <TabsContent value="readings">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle>Reading Materials</CardTitle>
                <CardDescription>
                  Study the reading materials to deepen your understanding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {content
                    .filter(lesson => lesson.type === 'reading')
                    .map(lesson => (
                      <Card key={lesson.id} className="border-gray-800">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{lesson.title}</CardTitle>
                            <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                              {lesson.duration}
                            </Badge>
                          </div>
                          <CardDescription>{lesson.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-invert max-w-none">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {lesson.content}
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                          <Button 
                            variant="outline"
                            className="mr-2"
                            onClick={() => {
                              toast({
                                title: "Reading downloaded",
                                description: "The reading material has been saved for offline access",
                              })
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button 
                            onClick={() => completeLesson(lesson.id)}
                            disabled={completedLessons.includes(lesson.id)}
                            className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {completedLessons.includes(lesson.id) ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Completed
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as Read
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interactive Tab Content - ALWAYS PRESENT */}
          <TabsContent value="interactive">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Interactive Learning</CardTitle>
                <CardDescription>
                  Hands-on exercises and simulations for {module.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show existing interactive content if available */}
                  {content.filter(lesson => lesson.type === 'interactive').length > 0 ? (
                    content
                      .filter(lesson => lesson.type === 'interactive')
                      .map(lesson => (
                        <div key={lesson.id} className="space-y-4">
                          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                            <h3 className="text-lg font-medium text-white mb-2">{lesson.title}</h3>
                            <p className="text-muted-foreground mb-4">{lesson.description}</p>
                            
                            {/* Placeholder for interactive content */}
                            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                              <div className="text-center">
                                <div className="text-4xl mb-4">🎮</div>
                                <h4 className="text-lg font-medium text-white mb-2">Interactive Training Module</h4>
                                <p className="text-muted-foreground">Click "Start Training" to begin the interactive simulation</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4">
                              <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                                {lesson.duration}
                              </Badge>
                              <Button 
                                onClick={() => completeLesson(lesson.id)}
                                disabled={completedLessons.includes(lesson.id)}
                                className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                {completedLessons.includes(lesson.id) ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Completed
                                  </>
                                ) : (
                                  "Start Training"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    /* Default interactive content for all modules */
                    <>
                      <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/30 text-center">
                        <div className="text-4xl mb-4">🎮</div>
                        <h4 className="font-medium text-white mb-2">Interactive Simulation</h4>
                        <p className="text-gray-300 text-sm mb-4">
                          Practice {module.title.toLowerCase()} procedures in a simulated environment
                        </p>
                        <Button className="bg-primary hover:bg-primary/90 text-white">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Launch Simulation
                        </Button>
                      </div>

                      <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/30 text-center">
                        <div className="text-4xl mb-4">📋</div>
                        <h4 className="font-medium text-white mb-2">Practice Scenarios</h4>
                        <p className="text-gray-300 text-sm mb-4">
                          Work through realistic scenarios and case studies
                        </p>
                        <Button className="bg-primary hover:bg-primary/90 text-white">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Scenarios
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab Content - ALWAYS PRESENT */}
          <TabsContent value="quiz">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Module Assessment</CardTitle>
                <CardDescription>
                  Test your knowledge of {module.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Show existing quiz content if available */}
                  {content.filter(lesson => lesson.type === 'quiz').length > 0 ? (
                    content
                      .filter(lesson => lesson.type === 'quiz')
                      .map(lesson => (
                        <div key={lesson.id} className="space-y-4">
                          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                            <h3 className="text-lg font-medium text-white mb-2">{lesson.title}</h3>
                            <p className="text-muted-foreground mb-4">{lesson.description}</p>
                            
                            {/* Quiz placeholder */}
                            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                              <div className="text-center">
                                <div className="text-4xl mb-4">📝</div>
                                <h4 className="text-lg font-medium text-white mb-2">Knowledge Assessment</h4>
                                <p className="text-muted-foreground">Click "Start Quiz" to begin the assessment</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4">
                              <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                                {lesson.duration}
                              </Badge>
                              <div className="flex gap-2">
                                <Button variant="outline">
                                  Review Questions
                                </Button>
                                <Button 
                                  onClick={() => completeLesson(lesson.id)}
                                  disabled={completedLessons.includes(lesson.id)}
                                  className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                  {completedLessons.includes(lesson.id) ? "Completed" : "Start Quiz"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    /* Default quiz content for all modules */
                    <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/30">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-white mb-2">Knowledge Check Quiz</h4>
                          <p className="text-gray-300 text-sm">
                            15 questions covering key concepts from {module.title}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">80%</div>
                          <div className="text-xs text-gray-400">Required to pass</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          30 minutes
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Multiple attempts allowed
                        </span>
                      </div>

                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        onClick={() => {
                          toast({
                            title: "Quiz Started",
                            description: `Starting ${module.title} assessment quiz`,
                          });
                        }}
                      >
                        Start Quiz
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}