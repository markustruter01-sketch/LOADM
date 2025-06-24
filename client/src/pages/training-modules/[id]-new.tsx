import { useState, useEffect } from 'react'
import { useRoute, useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle2, PlayCircle, BookOpen, MessageSquare, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from '@tanstack/react-query'

// Complete training modules data with all content
const completeTrainingModules = {
  "c17-globemaster-basics": {
    id: "c17-globemaster-basics",
    title: "C-17 Globemaster Basics",
    aircraft: "C-17",
    difficulty: "Beginner",
    duration: "4 hours",
    description: "Introduction to C-17 cargo loading fundamentals for beginner loadmasters",
    objectives: [
      "Understand C-17 cargo area layout and dimensions",
      "Learn basic weight and balance principles",
      "Identify standard pallet positions",
      "Execute basic cargo securing procedures"
    ],
    prerequisites: "Basic loadmaster training",
    instructor: "Chief Loadmaster",
    lastUpdated: "2024-01-15",
    videos: [
      { id: "v1", title: "C-17 Cargo Compartment Overview", duration: "15 min", description: "Tour of the C-17 cargo area" },
      { id: "v2", title: "Pallet Loading Basics", duration: "20 min", description: "Step-by-step pallet loading procedures" },
      { id: "v3", title: "Weight Distribution", duration: "18 min", description: "Understanding weight and balance calculations" }
    ],
    readings: [
      { id: "r1", title: "C-17 Loadmaster Manual Chapter 3", type: "PDF", pages: "45-78" },
      { id: "r2", title: "Weight and Balance Quick Reference", type: "Guide", pages: "12" },
      { id: "r3", title: "Safety Procedures Checklist", type: "Checklist", pages: "6" }
    ],
    interactive: [
      { id: "i1", title: "Pallet Positioning Simulator", type: "Simulation", description: "Practice positioning pallets in cargo area" },
      { id: "i2", title: "Weight Calculator Tool", type: "Calculator", description: "Interactive weight and balance calculator" }
    ],
    quiz: [
      { id: "q1", title: "C-17 Basics Knowledge Check", questions: 15, passingScore: 80, timeLimit: "20 min" }
    ]
  },
  "c130-load-planning-essentials": {
    id: "c130-load-planning-essentials",
    title: "C-130 Load Planning Essentials",
    aircraft: "C-130",
    difficulty: "Intermediate",
    duration: "6 hours",
    description: "Intermediate training on C-130 load planning and configuration",
    objectives: [
      "Create effective load plans for varied mission types",
      "Calculate proper weight distribution",
      "Configure the aircraft for dual load missions",
      "Understand airdrop load restrictions"
    ],
    prerequisites: "C-130 basics course",
    instructor: "Senior Loadmaster",
    lastUpdated: "2024-02-10",
    videos: [
      { id: "v1", title: "Mission Planning Overview", duration: "25 min", description: "Planning loads for different mission types" },
      { id: "v2", title: "Dual Load Configuration", duration: "30 min", description: "Setting up aircraft for multiple cargo types" },
      { id: "v3", title: "Airdrop Preparations", duration: "22 min", description: "Special considerations for airdrop missions" }
    ],
    readings: [
      { id: "r1", title: "C-130 Load Planning Manual", type: "Manual", pages: "120-156" },
      { id: "r2", title: "Mission Planning Worksheet", type: "Form", pages: "8" },
      { id: "r3", title: "Airdrop Safety Guidelines", type: "Guide", pages: "24" }
    ],
    interactive: [
      { id: "i1", title: "Load Planning Simulator", type: "Simulation", description: "Plan loads for various mission scenarios" },
      { id: "i2", title: "Weight Distribution Tool", type: "Calculator", description: "Verify weight distribution calculations" }
    ],
    quiz: [
      { id: "q1", title: "Load Planning Assessment", questions: 20, passingScore: 85, timeLimit: "30 min" }
    ]
  },
  "c27j-tactical-operations": {
    id: "c27j-tactical-operations",
    title: "C-27J Tactical Operations",
    aircraft: "C-27J",
    difficulty: "Intermediate",
    duration: "5 hours",
    description: "Intermediate tactical loading for C-27J operations",
    objectives: [
      "Execute loading plans for tactical operations",
      "Prepare aircraft for short field operations",
      "Perform rapid cargo loading procedures",
      "Understand tactical deployment considerations"
    ],
    prerequisites: "Basic tactical operations",
    instructor: "Tactical Operations Specialist",
    lastUpdated: "2024-01-20",
    videos: [
      { id: "v1", title: "Tactical Loading Procedures", duration: "28 min", description: "Quick loading for tactical missions" },
      { id: "v2", title: "Short Field Operations", duration: "24 min", description: "Loading considerations for short runways" },
      { id: "v3", title: "Rapid Deployment Setup", duration: "20 min", description: "Setting up for quick turnaround" }
    ],
    readings: [
      { id: "r1", title: "C-27J Tactical Manual", type: "Manual", pages: "89-124" },
      { id: "r2", title: "Short Field Procedures", type: "Guide", pages: "16" },
      { id: "r3", title: "Rapid Loading Checklist", type: "Checklist", pages: "4" }
    ],
    interactive: [
      { id: "i1", title: "Tactical Scenario Trainer", type: "Simulation", description: "Practice tactical loading scenarios" },
      { id: "i2", title: "Time Challenge Simulator", type: "Game", description: "Beat the clock loading challenges" }
    ],
    quiz: [
      { id: "q1", title: "Tactical Operations Test", questions: 18, passingScore: 80, timeLimit: "25 min" }
    ]
  },
  "kc30a-tanker-operations": {
    id: "kc30a-tanker-operations",
    title: "KC30-A Tanker Operations",
    aircraft: "KC30-A",
    difficulty: "Advanced",
    duration: "8 hours",
    description: "Advanced training for KC30-A multi-role tanker transport operations",
    objectives: [
      "Understand dual-role tanker/transport operations",
      "Master fuel system management",
      "Execute passenger and cargo mixed loads",
      "Perform aerial refueling support procedures"
    ],
    prerequisites: "Multi-engine transport experience",
    instructor: "KC30-A Subject Matter Expert",
    lastUpdated: "2024-02-05",
    videos: [
      { id: "v1", title: "Multi-Role Configuration", duration: "35 min", description: "Setting up for tanker/transport missions" },
      { id: "v2", title: "Fuel System Operations", duration: "40 min", description: "Managing fuel systems and transfers" },
      { id: "v3", title: "Mixed Load Procedures", duration: "32 min", description: "Combining passengers and cargo safely" }
    ],
    readings: [
      { id: "r1", title: "KC30-A Systems Manual", type: "Manual", pages: "200-289" },
      { id: "r2", title: "Fuel Management Procedures", type: "Guide", pages: "45" },
      { id: "r3", title: "Mixed Load Safety Guide", type: "Safety Guide", pages: "28" }
    ],
    interactive: [
      { id: "i1", title: "Multi-Role Mission Planner", type: "Simulation", description: "Plan complex multi-role missions" },
      { id: "i2", title: "Fuel System Trainer", type: "Simulation", description: "Practice fuel system operations" }
    ],
    quiz: [
      { id: "q1", title: "Advanced Operations Assessment", questions: 25, passingScore: 90, timeLimit: "40 min" }
    ]
  }
}

export default function TrainingModuleDetail() {
  const [, params] = useRoute('/training-modules/:id')
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("videos")
  const [completedItems, setCompletedItems] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

  const moduleId = params?.id
  const module = moduleId ? completeTrainingModules[moduleId as keyof typeof completeTrainingModules] : null

  // Calculate progress based on completed items
  useEffect(() => {
    if (module) {
      const totalItems = (module.videos?.length || 0) + (module.readings?.length || 0) + 
                       (module.interactive?.length || 0) + (module.quiz?.length || 0)
      const completedCount = completedItems.length
      const newProgress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0
      setProgress(newProgress)
    }
  }, [completedItems, module])

  const completeItem = (itemId: string) => {
    if (!completedItems.includes(itemId)) {
      setCompletedItems(prev => [...prev, itemId])
      toast({
        title: "Item Completed",
        description: "Great job! Keep up the good work.",
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (!module) {
    return (
      <div className="page-container" style={{ backgroundColor: '#1f2937', minHeight: '100vh', background: '#1f2937' }}>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Module Not Found</h1>
            <p className="text-gray-300 mb-6">The training module you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/training-modules')} className="bg-orange-500 hover:bg-orange-600 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Modules
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ backgroundColor: '#1f2937', minHeight: '100vh', background: '#1f2937' }}>
      <div className="container mx-auto px-4 py-6 max-w-6xl" style={{ backgroundColor: '#1f2937' }}>
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
            <h1 className="text-2xl font-bold text-white">{module.title}</h1>
            <p className="text-gray-400">{module.aircraft} • {module.difficulty} Level</p>
          </div>
        </div>

        {/* Module Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 border-gray-800 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white">Module Progress</CardTitle>
              <CardDescription className="text-gray-300">
                {Math.round(progress)}% Complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="mb-4" />
              <p className="text-gray-300 mb-4">{module.description}</p>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white mb-2">Learning Objectives</h3>
                <ul className="space-y-2">
                  {module.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white">Module Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <Badge className={getDifficultyColor(module.difficulty)}>
                    {module.difficulty}
                  </Badge>
                </div>
                <div className="text-gray-300">
                  <strong>Duration:</strong> {module.duration}
                </div>
                <div className="text-gray-300">
                  <strong>Aircraft:</strong> {module.aircraft}
                </div>
                <div className="text-gray-300">
                  <strong>Instructor:</strong> {module.instructor}
                </div>
                <div className="text-gray-300">
                  <strong>Prerequisites:</strong> {module.prerequisites}
                </div>
                <div className="text-gray-300">
                  <strong>Last Updated:</strong> {module.lastUpdated}
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-white mb-2">Certificate</h4>
                <p className="text-sm text-gray-400 mb-4">Complete all lessons to earn your certificate</p>
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={progress < 100}
                >
                  <Award className="h-4 w-4 mr-2" />
                  {progress >= 100 ? 'Download Certificate' : 'Complete Module First'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="videos" className="text-gray-300 data-[state=active]:text-white">Videos</TabsTrigger>
            <TabsTrigger value="readings" className="text-gray-300 data-[state=active]:text-white">Readings</TabsTrigger>
            <TabsTrigger value="interactive" className="text-gray-300 data-[state=active]:text-white">Interactive</TabsTrigger>
            <TabsTrigger value="quiz" className="text-gray-300 data-[state=active]:text-white">Quiz</TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <Card className="border-gray-800 bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Training Videos</CardTitle>
                <CardDescription className="text-gray-300">
                  Watch these videos to learn the concepts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {module.videos.map((video) => (
                    <div key={video.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-white mb-2">{video.title}</h3>
                          <p className="text-gray-300 mb-4">{video.description}</p>
                          
                          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 mb-4">
                            <div className="text-center">
                              <PlayCircle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                              <p className="text-gray-300">Video Player</p>
                              <p className="text-sm text-gray-400">{video.duration}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30 text-gray-300">
                              {video.duration}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => completeItem(video.id)}
                              disabled={completedItems.includes(video.id)}
                              className={completedItems.includes(video.id) ? 
                                "bg-green-600 hover:bg-green-700 text-white" : 
                                "bg-orange-500 hover:bg-orange-600 text-white"
                              }
                            >
                              {completedItems.includes(video.id) ? (
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Readings Tab */}
          <TabsContent value="readings">
            <Card className="border-gray-800 bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Reading Materials</CardTitle>
                <CardDescription className="text-gray-300">
                  Study these materials to deepen your understanding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {module.readings.map((reading) => (
                    <div key={reading.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-white mb-2">{reading.title}</h3>
                          <div className="flex items-center gap-4 text-gray-300 mb-4">
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {reading.type}
                            </Badge>
                            <span className="text-sm">{reading.pages} pages</span>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              size="sm"
                              onClick={() => completeItem(reading.id)}
                              disabled={completedItems.includes(reading.id)}
                              className={completedItems.includes(reading.id) ? 
                                "bg-green-600 hover:bg-green-700 text-white" : 
                                "bg-orange-500 hover:bg-orange-600 text-white"
                              }
                            >
                              {completedItems.includes(reading.id) ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Read Now
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interactive Tab */}
          <TabsContent value="interactive">
            <Card className="border-gray-800 bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Interactive Training</CardTitle>
                <CardDescription className="text-gray-300">
                  Hands-on simulations and tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {module.interactive.map((item) => (
                    <div key={item.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                          <p className="text-gray-300 mb-4">{item.description}</p>
                          
                          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 mb-4">
                            <div className="text-center">
                              <div className="text-4xl mb-4">🎮</div>
                              <h4 className="text-lg font-medium text-white mb-2">Interactive {item.type}</h4>
                              <p className="text-gray-300">Click "Start Training" to begin</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              {item.type}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => completeItem(item.id)}
                              disabled={completedItems.includes(item.id)}
                              className={completedItems.includes(item.id) ? 
                                "bg-green-600 hover:bg-green-700 text-white" : 
                                "bg-orange-500 hover:bg-orange-600 text-white"
                              }
                            >
                              {completedItems.includes(item.id) ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Start Training
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz">
            <Card className="border-gray-800 bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Knowledge Assessment</CardTitle>
                <CardDescription className="text-gray-300">
                  Test your understanding with these quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {module.quiz.map((quiz) => (
                    <div key={quiz.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-white mb-2">{quiz.title}</h3>
                          <div className="grid grid-cols-3 gap-4 text-gray-300 mb-4">
                            <div>
                              <strong>Questions:</strong> {quiz.questions}
                            </div>
                            <div>
                              <strong>Passing Score:</strong> {quiz.passingScore}%
                            </div>
                            <div>
                              <strong>Time Limit:</strong> {quiz.timeLimit}
                            </div>
                          </div>
                          
                          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 mb-4">
                            <div className="text-center">
                              <div className="text-4xl mb-4">📝</div>
                              <h4 className="text-lg font-medium text-white mb-2">Knowledge Assessment</h4>
                              <p className="text-gray-300">Click "Start Quiz" to begin the assessment</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              size="sm"
                              onClick={() => completeItem(quiz.id)}
                              disabled={completedItems.includes(quiz.id)}
                              className={completedItems.includes(quiz.id) ? 
                                "bg-green-600 hover:bg-green-700 text-white" : 
                                "bg-orange-500 hover:bg-orange-600 text-white"
                              }
                            >
                              {completedItems.includes(quiz.id) ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Start Quiz
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}