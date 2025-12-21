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

// Local training modules data (fallback)
const trainingModules = [
  {
    id: "c17-basics",
    title: "C-17 Basics",
    aircraft: "C-17 Globemaster III",
    difficulty: "Beginner",
    duration: "2 hours",
    description: "Learn the fundamentals of C-17 Globemaster III loadmaster operations",
    objectives: ["Understanding aircraft capabilities", "Basic loading procedures", "Safety protocols"],
    prerequisites: "None",
    instructor: "Loadmaster Instructor",
    lastUpdated: "2024-01-15"
  }
]

// Aircraft configurations for display
const aircraftConfigs = {
  "c17-basics": { name: "C-17 Globemaster III", type: "Strategic Airlift" },
  "c130-basics": { name: "C-130 Hercules", type: "Tactical Airlift" },
  "kc30a-basics": { name: "KC30-A MRTT", type: "Multi-Role Tanker" },
  "c27j-basics": { name: "C-27J Spartan", type: "Tactical Airlift" }
}

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
      title: "Basic Loading Procedures Quiz",
      type: "quiz",
      duration: "25 min",
      description: "Quiz on fundamental C-17 loading procedures",
      content: "Quiz content would be displayed here",
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
      title: "C-17 Fundamentals Assessment",
      type: "assessment",
      duration: "15 min",
      description: "Final assessment of C-17 fundamentals knowledge",
      content: "Assessment content would be displayed here",
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
      title: "Basic Loading Procedures Quiz",
      type: "quiz",
      duration: "20 min",
      description: "Quiz on basic C-130 loading procedures",
      content: "Quiz content for C-130 loading",
      completed: false
    },
    {
      id: "c130-basics-4",
      title: "C-130 Fundamentals Assessment",
      type: "assessment",
      duration: "12 min",
      description: "Final assessment of C-130 fundamental knowledge",
      content: "Assessment for C-130 fundamentals",
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
      title: "Basic Cargo Operations Quiz",
      type: "quiz",
      duration: "25 min",
      description: "Quiz on basic KC30-A cargo operations",
      content: "Quiz content for KC30-A operations",
      completed: false
    },
    {
      id: "kc30a-basics-4",
      title: "KC30-A Basics Assessment",
      type: "assessment",
      duration: "15 min",
      description: "Final assessment of KC30-A basic knowledge",
      content: "Assessment for KC30-A basics",
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
      title: "Basic Loading Procedures Quiz",
      type: "quiz",
      duration: "22 min",
      description: "Quiz on basic C-27J loading procedures",
      content: "Quiz content for C-27J loading",
      completed: false
    },
    {
      id: "c27j-basics-4",
      title: "C-27J Fundamentals Assessment",
      type: "assessment",
      duration: "14 min",
      description: "Final assessment of C-27J fundamental knowledge",
      content: "Assessment for C-27J fundamentals",
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

  // Use API data if available, otherwise fallback to local data
  const modules = apiModules || trainingModules
  
  // Find the module that matches the ID parameter (convert to number if needed)
  const moduleId = params?.id || ''
  const numericId = parseInt(moduleId)
  const module = modules.find(m => m.id === numericId || m.id === moduleId)

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

  // Fetch available quizzes for quiz/assessment buttons
  const { data: availableQuizzes } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: async () => {
      const response = await fetch('/api/quizzes')
      if (!response.ok) return []
      return response.json()
    },
  })

  // Generate dynamic content from module topics when no hardcoded content exists
  const generateDynamicContent = (mod: any) => {
    if (!mod || !mod.topics || !Array.isArray(mod.topics)) return []
    
    const dynamicContent: any[] = []
    const topics = mod.topics as string[]
    
    // Generate reading content from topics
    topics.forEach((topic: string, index: number) => {
      dynamicContent.push({
        id: `${mod.id}-reading-${index}`,
        title: topic,
        type: 'reading',
        duration: `${10 + (index * 2)} min`,
        description: `Study materials covering ${topic.toLowerCase()}`,
        content: `This section covers ${topic}. The content includes detailed explanations, diagrams, and examples relevant to ${mod.title}.`,
        completed: false
      })
    })
    
    // Add a video lesson
    dynamicContent.push({
      id: `${mod.id}-video-intro`,
      title: `${mod.title} - Video Overview`,
      type: 'video',
      duration: '20 min',
      description: `Video introduction and demonstration for ${mod.title}`,
      content: 'Video content covering key concepts and practical demonstrations',
      completed: false
    })
    
    // Add quiz
    dynamicContent.push({
      id: `${mod.id}-quiz`,
      title: `${mod.title} Knowledge Quiz`,
      type: 'quiz',
      duration: '25 min',
      description: `Test your understanding of ${mod.title.toLowerCase()} concepts`,
      content: 'Quiz questions to assess your knowledge',
      completed: false
    })
    
    // Add assessment
    dynamicContent.push({
      id: `${mod.id}-assessment`,
      title: `${mod.title} Final Assessment`,
      type: 'assessment',
      duration: '45 min',
      description: `Comprehensive assessment for ${mod.title}`,
      content: 'Final assessment covering all module topics',
      completed: false
    })
    
    return dynamicContent
  }

  // Map API module IDs to content keys
  const getContentKey = (mod: any) => {
    if (!mod) return ''
    
    // If it's a numeric ID from API, map to content key
    if (typeof mod.id === 'number') {
      const aircraft = mod.aircraft
      const difficulty = mod.difficulty
      
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
    return mod.id || ''
  }

  // Get lesson content - use hardcoded if available, otherwise generate from topics
  const contentKey = getContentKey(module)
  const hardcodedContent = moduleContents[contentKey] || []
  const content = hardcodedContent.length > 0 ? hardcodedContent : generateDynamicContent(module)

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
            <TabsTrigger value="quiz" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Quiz
            </TabsTrigger>
            <TabsTrigger value="assessment" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Assessment
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

          {/* Quiz Tab Content - ALWAYS PRESENT */}
          <TabsContent value="quiz">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Knowledge Quiz</CardTitle>
                <CardDescription>
                  Test your understanding with quiz questions for {module.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show quiz content - always navigate to actual quiz */}
                  {content.filter(lesson => lesson.type === 'quiz').length > 0 ? (
                    content
                      .filter(lesson => lesson.type === 'quiz')
                      .map(lesson => (
                        <div key={lesson.id} className="space-y-4">
                          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                            <h3 className="text-lg font-medium text-white mb-2">{lesson.title}</h3>
                            <p className="text-muted-foreground mb-4">{lesson.description}</p>
                            
                            {/* Placeholder for quiz content */}
                            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                              <div className="text-center">
                                <div className="text-4xl mb-4">📝</div>
                                <h4 className="text-lg font-medium text-white mb-2">Knowledge Quiz</h4>
                                <p className="text-muted-foreground">Click "Start Quiz" to test your knowledge</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4">
                              <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                                {lesson.duration}
                              </Badge>
                              <Button 
                                className="bg-primary hover:bg-primary/90 text-white"
                                onClick={() => {
                                  // Navigate to an available quiz
                                  if (availableQuizzes && availableQuizzes.length > 0) {
                                    navigate(`/quizzes/${availableQuizzes[0].id}`)
                                  } else {
                                    navigate('/scenarios')
                                  }
                                }}
                              >
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Start Quiz
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    /* Default quiz content for all modules */
                    <>
                      <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/30 text-center">
                        <div className="text-4xl mb-4">📝</div>
                        <h4 className="font-medium text-white mb-2">Knowledge Quiz</h4>
                        <p className="text-gray-300 text-sm mb-4">
                          Test your understanding of {module.title.toLowerCase()} concepts
                        </p>
                        <Button 
                          className="bg-primary hover:bg-primary/90 text-white"
                          onClick={() => {
                            // Navigate to an available quiz
                            if (availableQuizzes && availableQuizzes.length > 0) {
                              navigate(`/quizzes/${availableQuizzes[0].id}`)
                            } else {
                              toast({
                                title: "No Quizzes Available",
                                description: "Please check the Scenarios page for available quizzes.",
                              })
                              navigate('/scenarios')
                            }
                          }}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Quiz
                        </Button>
                      </div>

                      <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/30 text-center">
                        <div className="text-4xl mb-4">🎯</div>
                        <h4 className="font-medium text-white mb-2">Practice Questions</h4>
                        <p className="text-gray-300 text-sm mb-4">
                          Review practice questions to reinforce your learning
                        </p>
                        <Button 
                          className="bg-primary hover:bg-primary/90 text-white"
                          onClick={() => navigate('/scenarios')}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Practice Now
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment Tab Content - ALWAYS PRESENT */}
          <TabsContent value="assessment">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Module Assessment</CardTitle>
                <CardDescription>
                  Final assessment to validate your knowledge of {module.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Show assessment content - always navigate to actual quiz */}
                  {content.filter(lesson => lesson.type === 'assessment').length > 0 ? (
                    content
                      .filter(lesson => lesson.type === 'assessment')
                      .map(lesson => (
                        <div key={lesson.id} className="space-y-4">
                          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                            <h3 className="text-lg font-medium text-white mb-2">{lesson.title}</h3>
                            <p className="text-muted-foreground mb-4">{lesson.description}</p>
                            
                            {/* Assessment placeholder */}
                            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                              <div className="text-center">
                                <div className="text-4xl mb-4">🎓</div>
                                <h4 className="text-lg font-medium text-white mb-2">Final Assessment</h4>
                                <p className="text-muted-foreground">Click "Start Assessment" to begin the final evaluation</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4">
                              <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                                {lesson.duration}
                              </Badge>
                              <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setCurrentTab('readings')}>
                                  Review Material
                                </Button>
                                <Button 
                                  className="bg-primary hover:bg-primary/90 text-white"
                                  onClick={() => {
                                    if (availableQuizzes && availableQuizzes.length > 0) {
                                      navigate(`/quizzes/${availableQuizzes[0].id}`)
                                    } else {
                                      navigate('/scenarios')
                                    }
                                  }}
                                >
                                  <GraduationCap className="h-4 w-4 mr-2" />
                                  Start Assessment
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    /* Default assessment content for all modules */
                    <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/30">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-white mb-2">Final Module Assessment</h4>
                          <p className="text-gray-300 text-sm">
                            Comprehensive assessment covering all concepts from {module.title}
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
                          45 minutes
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Multiple attempts allowed
                        </span>
                      </div>

                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        onClick={() => {
                          // Navigate to scenarios page for assessments, or a specific quiz
                          if (availableQuizzes && availableQuizzes.length > 0) {
                            navigate(`/quizzes/${availableQuizzes[0].id}`)
                          } else {
                            navigate('/scenarios')
                          }
                        }}
                      >
                        Start Assessment
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