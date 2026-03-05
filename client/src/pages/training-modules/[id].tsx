import { useState, useEffect, useRef } from 'react'
import { useRoute, useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle2, PlayCircle, Download, GraduationCap, Clock, Users, Star, Plane, BookOpen, Target, Award, FileText, FileCheck, AlertCircle, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from '@tanstack/react-query'
import { useIsolatedAuth } from "@/auth-isolated/auth-context"
import C17CargoBayLayout from "./reading-content/c17-cargo-bay-layout"
import C17WeightBalance from "./reading-content/c17-weight-balance"
import C130CargoConfigurations from "./reading-content/c130-cargo-configurations"
import KC30ACargoBaySystems from "./reading-content/kc30a-cargo-systems"
import C27JOperations from "./reading-content/c27j-operations"
import { getDynamicReadingJSX } from "./reading-content/dynamic-content"

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

// Map lesson IDs to their reading content components
const readingContentMap: Record<string, () => JSX.Element> = {
  "c17-cargo-bay-layout": C17CargoBayLayout,
  "c17-basics-4": C17WeightBalance,
  "c130-basics-2": C130CargoConfigurations,
  "kc30a-basics-2": KC30ACargoBaySystems,
  "c27j-basics-2": C27JOperations,
}

// Sample quiz questions per airframe
const moduleQuizData: Record<string, { questions: { id: string; question: string; options: string[]; correct: number }[] }> = {
  "c17-basics": {
    questions: [
      {
        id: "c17-q1",
        question: "What is the maximum payload capacity of the C-17 Globemaster III?",
        options: ["55,000 kg", "77,519 kg", "100,000 kg", "45,000 kg"],
        correct: 1
      },
      {
        id: "c17-q2",
        question: "What type of cargo restraint system is primarily used in C-17 operations?",
        options: ["Netting only", "Chains and heavy straps", "Pallet locks and NATO-standard tie-down rings", "Foam padding and friction mats"],
        correct: 2
      },
      {
        id: "c17-q3",
        question: "The C-17 cargo floor roller system is designed to assist with:",
        options: ["Passenger boarding", "Fuel transfer operations", "Movement and positioning of palletised cargo", "Crew rest equipment setup"],
        correct: 2
      },
      {
        id: "c17-q4",
        question: "What is the maximum floor load rating per linear metre for the C-17 main cargo deck?",
        options: ["5,000 kg/lm", "10,000 kg/lm", "15,450 kg/lm", "20,000 kg/lm"],
        correct: 2
      },
      {
        id: "c17-q5",
        question: "Before commencing C-17 cargo loading, the loadmaster must first verify:",
        options: ["Fuel state only", "Load plan, weight and balance sheet, and aircraft documentation", "Passenger manifest", "Maintenance crew availability"],
        correct: 1
      },
      {
        id: "c17-q6",
        question: "What minimum breaking strength (MBS) is required for tie-down chains used on the C-17?",
        options: ["5,000 lb MBS", "10,000 lb MBS", "20,000 lb MBS", "25,000 lb MBS"],
        correct: 2
      },
      {
        id: "c17-q7",
        question: "The C-17's rear cargo ramp can support vehicle loading up to what maximum axle load?",
        options: ["5 tonnes per axle", "10 tonnes per axle", "15 tonnes per axle", "20 tonnes per axle"],
        correct: 1
      }
    ]
  },
  "c130-basics": {
    questions: [
      {
        id: "c130-q1",
        question: "What is the maximum payload weight of the C-130 Hercules?",
        options: ["10,000 kg", "19,000 kg", "25,000 kg", "30,000 kg"],
        correct: 1
      },
      {
        id: "c130-q2",
        question: "The C-130's cargo ramp is primarily designed to support:",
        options: ["Passenger boarding only", "Vehicle loading and airdrop operations", "Fuel transfer", "Medical evacuation only"],
        correct: 1
      },
      {
        id: "c130-q3",
        question: "When loading wheeled vehicles on the C-130, the loadmaster must observe:",
        options: ["No restrictions apply", "Floor load limits per square metre", "Weight distribution via pallets only", "Maximum axle load limits per the load manual"],
        correct: 3
      },
      {
        id: "c130-q4",
        question: "What safety check must be completed before closing the C-130 cargo ramp for departure?",
        options: ["Fuel check only", "Tie-down tension verification and cargo headcount", "Engine start clearance from ATC", "Altimeter setting confirmation"],
        correct: 1
      },
      {
        id: "c130-q5",
        question: "The C-130 cargo compartment is approximately how long?",
        options: ["7.5 m", "12.0 m", "16.9 m", "20.0 m"],
        correct: 1
      },
      {
        id: "c130-q6",
        question: "What is the standard tie-down pattern for palletised cargo in the C-130?",
        options: ["2 forward, 2 aft", "4 forward, 4 aft at 45-degree angles", "Chain only fore and aft", "No pattern required if pallet locks engaged"],
        correct: 1
      },
      {
        id: "c130-q7",
        question: "At what aircraft bank angle must cargo be secured to prevent shifting during flight?",
        options: ["10 degrees", "20 degrees", "30 degrees", "45 degrees"],
        correct: 2
      }
    ]
  },
  "kc30a-basics": {
    questions: [
      {
        id: "kc30a-q1",
        question: "What is the primary dual role of the KC30-A MRTT?",
        options: ["Fighter escort and surveillance", "Aerial refuelling and cargo/passenger transport", "Maritime patrol and electronic warfare", "VIP transport and medical evacuation"],
        correct: 1
      },
      {
        id: "kc30a-q2",
        question: "The KC30-A uses which refuelling system for fast-jet operations?",
        options: ["Probe and drogue only", "Flying boom only", "Both probe/drogue pods and centreline flying boom", "Gravity transfer only"],
        correct: 2
      },
      {
        id: "kc30a-q3",
        question: "What document must be verified before initiating KC30-A cargo loading operations?",
        options: ["Passenger manifest only", "Load plan and weight and balance sheet", "Fuel uplift record only", "Maintenance crew sign-off only"],
        correct: 1
      },
      {
        id: "kc30a-q4",
        question: "The KC30-A main deck can accommodate how many standard military cargo pallets?",
        options: ["4 pallets", "8 pallets", "12 pallets", "20 pallets"],
        correct: 2
      },
      {
        id: "kc30a-q5",
        question: "What is the approximate maximum fuel transfer capacity of the KC30-A?",
        options: ["50,000 litres", "100,000 litres", "270,000 litres", "150,000 litres"],
        correct: 2
      },
      {
        id: "kc30a-q6",
        question: "When transitioning the KC30-A from passenger configuration to cargo, the loadmaster must first:",
        options: ["Remove all seating and notify engineering", "Complete a pre-conversion inspection and update the load plan", "Refuel the aircraft to maximum capacity", "Brief the flight crew on new weight limits"],
        correct: 1
      },
      {
        id: "kc30a-q7",
        question: "Dangerous goods carried on the KC30-A must comply with which regulations?",
        options: ["ICAO TI and IATA DGR", "Local ground transport rules only", "Manufacturer guidelines only", "No formal regulations apply to military aircraft"],
        correct: 0
      }
    ]
  },
  "c27j-basics": {
    questions: [
      {
        id: "c27j-q1",
        question: "What is the maximum payload of the C-27J Spartan?",
        options: ["4,000 kg", "6,000 kg", "11,500 kg", "15,000 kg"],
        correct: 2
      },
      {
        id: "c27j-q2",
        question: "What characteristic makes the C-27J particularly suited for short unprepared airstrip operations?",
        options: ["Jet engines for rapid acceleration", "High-lift wing design combined with turboprop propulsion", "Extended undercarriage for rough terrain", "Retractable cargo ramp for aerodynamic efficiency"],
        correct: 1
      },
      {
        id: "c27j-q3",
        question: "The C-27J is primarily employed for which type of mission?",
        options: ["Strategic long-range airlift", "Ocean patrol and maritime surveillance", "Tactical intra-theatre transport and battlefield logistics", "Heavy lift and outsized cargo"],
        correct: 2
      },
      {
        id: "c27j-q4",
        question: "Which tie-down method is standard for securing palletised cargo in the C-27J?",
        options: ["Friction mats only", "CGU-1/B straps to floor tie-down rings", "Bungee cords rated at 500 kg", "Net restraints along the fuselage wall"],
        correct: 1
      },
      {
        id: "c27j-q5",
        question: "Before any airdrop operation from the C-27J, the loadmaster must confirm:",
        options: ["Only fuel state is correct", "Drop zone weather, rigging configuration, and equipment inspection complete", "Passenger count and seating plan", "Maintenance release only"],
        correct: 1
      },
      {
        id: "c27j-q6",
        question: "What is the approximate usable cargo compartment length of the C-27J Spartan?",
        options: ["5.5 m", "8.0 m", "10.5 m", "12.2 m"],
        correct: 1
      },
      {
        id: "c27j-q7",
        question: "When loading hazardous materials aboard the C-27J, the loadmaster is responsible for:",
        options: ["Confirming the items are declared and segregated per DG regulations", "Only informing the pilot verbally", "Signing the manifest and ignoring segregation rules", "Delegating all responsibility to the ground crew"],
        correct: 0
      }
    ]
  }
}

export default function ModuleDetailPage() {
  const [, params] = useRoute('/training-modules/:id')
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const { user } = useIsolatedAuth()
  const [currentTab, setCurrentTab] = useState('overview')
  const [moduleProgress, setModuleProgress] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  // Quiz tab state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizSquadron, setQuizSquadron] = useState('AMG')
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [quizResults, setQuizResults] = useState<{ questionId: string; isCorrect: boolean; correctAnswer: string; yourAnswer: string; questionText: string }[]>([])
  const [quizSubmitting, setQuizSubmitting] = useState(false)
  const quizResultsRef = useRef<HTMLDivElement>(null)

  // Expanded readings state
  const [expandedReadings, setExpandedReadings] = useState<string[]>([])
  
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

  // Quiz handlers
  const handleQuizSubmit = () => {
    const quizData = moduleQuizData[contentKey]
    if (!quizData) return

    const questions = quizData.questions
    if (Object.keys(quizAnswers).length < questions.length) {
      toast({
        title: "Incomplete quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      })
      return
    }

    setQuizSubmitting(true)
    setTimeout(() => {
      let correct = 0
      const results = questions.map(q => {
        const answeredIndex = parseInt(quizAnswers[q.id] || "-1")
        const isCorrect = answeredIndex === q.correct
        if (isCorrect) correct++
        return {
          questionId: q.id,
          questionText: q.question,
          isCorrect,
          yourAnswer: q.options[answeredIndex] || "No answer",
          correctAnswer: q.options[q.correct]
        }
      })
      const score = Math.round((correct / questions.length) * 100)
      setQuizScore(score)
      setQuizResults(results)
      setQuizSubmitted(true)
      setQuizSubmitting(false)
      toast({
        title: "Quiz Submitted!",
        description: `You scored ${score}% (${correct}/${questions.length} correct)`,
      })
      setTimeout(() => {
        quizResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }, 600)
  }

  const resetQuiz = () => {
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(null)
    setQuizResults([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 1
      case 'intermediate': return 2
      case 'advanced': return 3
      case 'expert': return 4
      default: return 1
    }
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

          {/* Overview Tab - Compact Visual Design */}
          <TabsContent value="overview">
            <div className="space-y-4">
              {/* Hero Banner Section - Compact */}
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                
                <div className="relative p-4">
                  <div className="flex items-start gap-4">
                    {/* Module Icon - Smaller */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                        <Plane className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                    
                    {/* Module Info - Compact */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-2 py-0.5">
                          {getAircraftName(module.id)}
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs px-2 py-0.5">
                          {module.difficulty}
                        </Badge>
                        <div className="flex items-center gap-0.5">
                          {[...Array(getDifficultyStars(module.difficulty))].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                          ))}
                          {[...Array(4 - getDifficultyStars(module.difficulty))].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-gray-600" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats Row - Inline Compact */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700/50">
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1 rounded border border-gray-700">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs text-gray-300">{module.duration || '3 hours'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1 rounded border border-gray-700">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-gray-300">{content.length} lessons</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1 rounded border border-gray-700">
                      <Target className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-xs text-gray-300">80% pass</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1 rounded border border-gray-700">
                      <Award className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs text-gray-300">Certificate</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Content Grid - Compact */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Learning Content */}
                <div className="lg:col-span-2 space-y-4">
                  {/* What You'll Learn - Compact Cards */}
                  <Card className="border-gray-800 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-gradient-to-r from-gray-800/50 to-transparent border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-green-500/20 flex items-center justify-center">
                          <Target className="w-4 h-4 text-green-400" />
                        </div>
                        <CardTitle className="text-white text-sm">What You'll Learn</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {module.objectives?.map((objective, index) => (
                          <div 
                            key={index} 
                            className="flex items-start gap-2 p-2.5 rounded bg-gray-800/30 border border-gray-700/50"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300 text-xs leading-relaxed">{objective}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Topics Preview - Compact */}
                  <Card className="border-gray-800 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-gradient-to-r from-gray-800/50 to-transparent border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-blue-500/20 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                        </div>
                        <CardTitle className="text-white text-sm">Topics Covered</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {module.topics?.map((topic, index) => (
                          <Badge 
                            key={index}
                            variant="outline" 
                            className="px-2 py-0.5 text-xs bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-colors cursor-default"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Course Structure - Compact */}
                  <Card className="border-gray-800 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-gradient-to-r from-gray-800/50 to-transparent border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-purple-500/20 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-purple-400" />
                        </div>
                        <CardTitle className="text-white text-sm">Course Structure</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 rounded bg-gray-800/30 border border-gray-700/50">
                          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <PlayCircle className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="text-lg font-bold text-white">{content.filter(l => l.type === 'video').length || 2}</div>
                          <div className="text-xs text-gray-400">Videos</div>
                        </div>
                        <div className="text-center p-2 rounded bg-gray-800/30 border border-gray-700/50">
                          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="text-lg font-bold text-white">{content.filter(l => l.type === 'reading').length || (module.topics?.length || 5)}</div>
                          <div className="text-xs text-gray-400">Readings</div>
                        </div>
                        <div className="text-center p-2 rounded bg-gray-800/30 border border-gray-700/50">
                          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <FileCheck className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="text-lg font-bold text-white">{content.filter(l => l.type === 'quiz').length || 1}</div>
                          <div className="text-xs text-gray-400">Quizzes</div>
                        </div>
                        <div className="text-center p-2 rounded bg-gray-800/30 border border-gray-700/50">
                          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div className="text-lg font-bold text-white">1</div>
                          <div className="text-xs text-gray-400">Assessment</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Sidebar - Compact */}
                <div className="space-y-3">
                  {/* Instructor Card - Compact */}
                  <Card className="border-gray-800 overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium truncate">{module.instructor || 'Squadron Instructor'}</h4>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map((star) => (
                              <Star key={star} className="w-2.5 h-2.5 fill-primary text-primary" />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">5.0</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 gap-2 text-center">
                        <div>
                          <div className="text-base font-bold text-white">150+</div>
                          <div className="text-xs text-gray-400">Students</div>
                        </div>
                        <div>
                          <div className="text-base font-bold text-white">12+</div>
                          <div className="text-xs text-gray-400">Years exp</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prerequisites & Last Updated - Combined Compact */}
                  <Card className="border-gray-800">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-400">Prerequisites</div>
                          <p className="text-xs text-gray-300">{module.prerequisites || 'None required'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                        <span className="text-xs text-gray-400">Updated</span>
                        <span className="text-xs text-white">{module.lastUpdated || 'Dec 2024'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Certificate Card - Compact */}
                  <Card className="border-gray-800 overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-3 border-b border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/20 flex items-center justify-center border border-yellow-500/30">
                          <Award className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="text-white text-sm font-medium">Certificate</h4>
                          <p className="text-xs text-gray-400">Upon completion</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          Complete all lessons
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          Pass assessment (80%+)
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        className="w-full bg-primary text-white hover:bg-primary/90 text-xs"
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
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {moduleProgress >= 100 ? "Get Certificate" : "Complete First"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
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

          {/* Readings Tab Content — PDF page viewer */}
          <TabsContent value="readings">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle>Reading Materials</CardTitle>
                <CardDescription>
                  Study the reading materials to deepen your understanding of {module.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {content
                    .filter(lesson => lesson.type === 'reading')
                    .map(lesson => {
                      const ReadingComponent = readingContentMap[lesson.id]
                      const isExpanded = expandedReadings.includes(lesson.id)
                      const isCompleted = completedLessons.includes(lesson.id)

                      return (
                        <div key={lesson.id} className="border border-gray-700 rounded-lg overflow-hidden">
                          {/* Document header bar */}
                          <div className="flex items-center justify-between px-5 py-4 bg-gray-800/60">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded bg-orange-500/15 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-orange-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">{lesson.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{lesson.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                                {lesson.duration}
                              </Badge>
                              {isCompleted && (
                                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Read
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                                onClick={() => setExpandedReadings(prev =>
                                  prev.includes(lesson.id)
                                    ? prev.filter(id => id !== lesson.id)
                                    : [...prev, lesson.id]
                                )}
                              >
                                {isExpanded ? "Close Document" : "Read Document"}
                              </Button>
                            </div>
                          </div>

                          {/* PDF-style page viewer */}
                          {isExpanded && (
                            <div className="bg-gray-700/30 p-6">
                              {/* Page container — white paper look */}
                              <div
                                className="mx-auto max-w-[780px] rounded-sm shadow-2xl"
                                style={{
                                  background: '#fafaf8',
                                  boxShadow: '0 4px 6px rgba(0,0,0,0.4), 0 10px 40px rgba(0,0,0,0.5)',
                                  border: '1px solid #d4d4d0',
                                }}
                              >
                                {/* Page top margin with document metadata strip */}
                                <div
                                  style={{
                                    borderBottom: '2px solid #c2410c',
                                    background: '#1c1917',
                                    padding: '10px 48px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <span style={{ color: '#fb923c', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    LOADMworkflow — Training Module
                                  </span>
                                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                                    {module.title}
                                  </span>
                                </div>

                                {/* Page body */}
                                <div style={{ padding: '48px 56px 56px', color: '#1c1917' }}>
                                  {ReadingComponent ? (
                                    <div
                                      style={{ color: '#1c1917' }}
                                      className="reading-document"
                                    >
                                      <style>{`
                                        .reading-document { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.75; }
                                        .reading-document h1 { font-size: 1.5rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem; font-family: system-ui, sans-serif; border-bottom: 2px solid #c2410c; padding-bottom: 0.5rem; }
                                        .reading-document h2 { font-size: 1.15rem; font-weight: 700; color: #1c1917; margin-top: 2rem; margin-bottom: 0.6rem; font-family: system-ui, sans-serif; }
                                        .reading-document h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-top: 1.25rem; margin-bottom: 0.4rem; font-family: system-ui, sans-serif; }
                                        .reading-document p { color: #374151; margin-bottom: 0.9rem; font-size: 0.925rem; }
                                        .reading-document ul, .reading-document ol { color: #374151; padding-left: 1.5rem; margin-bottom: 1rem; font-size: 0.925rem; }
                                        .reading-document li { margin-bottom: 0.35rem; }
                                        .reading-document strong { color: #1c1917; font-weight: 700; }
                                        .reading-document table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.875rem; }
                                        .reading-document th { background: #f3f4f6; color: #1c1917; font-weight: 700; padding: 8px 12px; border: 1px solid #d1d5db; text-align: left; }
                                        .reading-document td { padding: 7px 12px; border: 1px solid #d1d5db; color: #374151; }
                                        .reading-document tr:nth-child(even) td { background: #f9fafb; }
                                      `}</style>
                                      <ReadingComponent />
                                    </div>
                                  ) : (
                                    <div
                                      style={{ color: '#1c1917' }}
                                      className="reading-document"
                                    >
                                      <style>{`
                                        .reading-document { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.75; }
                                        .reading-document h1 { font-size: 1.5rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem; font-family: system-ui, sans-serif; border-bottom: 2px solid #c2410c; padding-bottom: 0.5rem; }
                                        .reading-document h2 { font-size: 1.15rem; font-weight: 700; color: #1c1917; margin-top: 2rem; margin-bottom: 0.6rem; font-family: system-ui, sans-serif; }
                                        .reading-document h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-top: 1.25rem; margin-bottom: 0.4rem; font-family: system-ui, sans-serif; }
                                        .reading-document p { color: #374151; margin-bottom: 0.9rem; font-size: 0.925rem; }
                                        .reading-document ul, .reading-document ol { color: #374151; padding-left: 1.5rem; margin-bottom: 1rem; font-size: 0.925rem; }
                                        .reading-document li { margin-bottom: 0.35rem; }
                                        .reading-document strong { color: #1c1917; font-weight: 700; }
                                        .reading-document table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.875rem; }
                                        .reading-document th { background: #f3f4f6; color: #1c1917; font-weight: 700; padding: 8px 12px; border: 1px solid #d1d5db; text-align: left; }
                                        .reading-document td { padding: 7px 12px; border: 1px solid #d1d5db; color: #374151; }
                                        .reading-document tr:nth-child(even) td { background: #f9fafb; }
                                      `}</style>
                                      {getDynamicReadingJSX(
                                        module.aircraft || "all",
                                        module.difficulty || "beginner",
                                        Array.isArray(module.topics) ? module.topics : [],
                                        module.title || lesson.title
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Page footer */}
                                <div
                                  style={{
                                    borderTop: '1px solid #e5e7eb',
                                    padding: '10px 48px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#f9faf8',
                                  }}
                                >
                                  <span style={{ color: '#9ca3af', fontSize: '10px' }}>
                                    RESTRICTED — FOR TRAINING PURPOSES ONLY
                                  </span>
                                  <span style={{ color: '#9ca3af', fontSize: '10px' }}>
                                    LOADMworkflow Training Platform
                                  </span>
                                </div>
                              </div>

                              {/* Mark as read button below the document */}
                              <div className="flex justify-center mt-5">
                                <Button
                                  onClick={() => {
                                    completeLesson(lesson.id)
                                    setExpandedReadings(prev => prev.filter(id => id !== lesson.id))
                                  }}
                                  disabled={isCompleted}
                                  className={isCompleted ? "bg-green-600 hover:bg-green-700 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}
                                >
                                  {isCompleted ? (
                                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Already Completed</>
                                  ) : (
                                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Read</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab Content - Inline quiz matching scenarios quiz UI */}
          <TabsContent value="quiz">
            {(() => {
              const quizData = moduleQuizData[contentKey]
              const questions = quizData?.questions || []

              if (!quizData || questions.length === 0) {
                return (
                  <Card className="border-gray-800">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No quiz questions are available for this module yet.
                    </CardContent>
                  </Card>
                )
              }

              return (
                <>
                  <Card className="mb-8 border-gray-800">
                    <CardHeader className="bg-orange-500/10 border-b border-gray-800">
                      <CardTitle className="text-2xl font-bold text-white">Knowledge Quiz</CardTitle>
                      <CardDescription>
                        Test your understanding of {module.title} concepts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Quiz info bar */}
                      <div className="bg-card p-4 rounded-lg border border-gray-800 mb-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Quiz Information</p>
                            <ul className="text-sm text-muted-foreground">
                              <li>• {questions.length} questions</li>
                              <li>• Passing score: 70%</li>
                            </ul>
                          </div>
                          <div className="min-w-[200px]">
                            <p className="text-sm font-medium mb-1">Your Squadron</p>
                            <Select value={quizSquadron} onValueChange={setQuizSquadron}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Squadron" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AMG">AMG</SelectItem>
                                <SelectItem value="33SQN">33SQN</SelectItem>
                                <SelectItem value="35SQN">35SQN</SelectItem>
                                <SelectItem value="36SQN">36SQN</SelectItem>
                                <SelectItem value="37SQN">37SQN</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-6">
                        {questions.map((question, index) => (
                          <Card key={question.id} className="border-gray-800">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg text-white">
                                Question {index + 1}: {question.question}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <RadioGroup
                                value={quizAnswers[question.id] || ""}
                                onValueChange={(value) =>
                                  setQuizAnswers(prev => ({ ...prev, [question.id]: value }))
                                }
                              >
                                <div className="space-y-3">
                                  {question.options.map((option, optionIndex) => (
                                    <div
                                      key={optionIndex}
                                      className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer"
                                      onClick={() =>
                                        setQuizAnswers(prev => ({ ...prev, [question.id]: optionIndex.toString() }))
                                      }
                                    >
                                      <RadioGroupItem
                                        value={optionIndex.toString()}
                                        id={`${question.id}-${optionIndex}`}
                                        className="pointer-events-none"
                                      />
                                      <Label
                                        htmlFor={`${question.id}-${optionIndex}`}
                                        className="text-base cursor-pointer flex-1 pointer-events-none"
                                      >
                                        {option}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </RadioGroup>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        {Object.keys(quizAnswers).length} of {questions.length} questions answered
                      </div>
                      <Button
                        className={`bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 ${
                          Object.keys(quizAnswers).length === questions.length ? 'opacity-100' : 'opacity-70'
                        }`}
                        disabled={quizSubmitting || Object.keys(quizAnswers).length < questions.length}
                        onClick={handleQuizSubmit}
                      >
                        {quizSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Submitting...
                          </div>
                        ) : "Submit Quiz"}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Results section */}
                  {quizSubmitted && quizScore !== null && (
                    <div ref={quizResultsRef} className="scroll-mt-8">
                      <Card className="mb-8 border-gray-800">
                        <CardHeader className={quizScore >= 70 ? "bg-green-500/10" : "bg-red-500/10"}>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
                            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              quizScore >= 70 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                            }`}>
                              {quizScore >= 70 ? (
                                <><Check className="h-4 w-4 mr-1" /> Passed</>
                              ) : (
                                <><X className="h-4 w-4 mr-1" /> Failed</>
                              )}
                            </div>
                          </div>
                          <CardDescription>
                            Quiz completed {new Date().toLocaleDateString()} · Squadron: {quizSquadron}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="mb-8 text-center">
                            <div className="text-6xl font-bold mb-2">{quizScore}%</div>
                            <p className="text-sm text-muted-foreground">
                              {quizScore >= 70
                                ? "Congratulations! You've passed this quiz."
                                : "You didn't pass this time. The passing score is 70%. Review the material and try again."}
                            </p>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold mb-2">Question Feedback</h3>
                            {quizResults.map((result, index) => (
                              <div
                                key={result.questionId}
                                className={`p-4 rounded-lg border ${
                                  result.isCorrect
                                    ? "border-green-500/30 bg-green-500/10"
                                    : "border-red-500/30 bg-red-500/10"
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`mt-1 ${result.isCorrect ? "text-green-500" : "text-red-500"}`}>
                                    {result.isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium mb-2">Question {index + 1}: {result.questionText}</p>
                                    <p className="text-sm font-medium">Your answer: {result.yourAnswer}</p>
                                    {!result.isCorrect && (
                                      <p className="text-sm font-medium text-green-500">
                                        Correct answer: {result.correctAnswer}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline" onClick={() => setCurrentTab('readings')}>
                            Review Material
                          </Button>
                          <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={resetQuiz}
                          >
                            Retry Quiz
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  )}
                </>
              )
            })()}
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