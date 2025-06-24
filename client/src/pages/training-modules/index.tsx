import { useState } from 'react'
import { Link } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plane, BookOpen, Video, Clock, Users, Award } from "lucide-react"
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

export default function TrainingModules() {
  const [selectedTab, setSelectedTab] = useState("all")
  const [completedModules, setCompletedModules] = useState(new Set())

  // Fetch training modules from API
  const { data: trainingModules = [], isLoading, error } = useQuery({
    queryKey: ['/api/training-modules'],
    queryFn: async () => {
      const response = await fetch('/api/training-modules');
      if (!response.ok) throw new Error('Failed to fetch training modules');
      return response.json();
    }
  });

  // Filter modules based on selected tab
  const filteredModules = selectedTab === "all" 
    ? trainingModules 
    : trainingModules.filter((module: any) => 
        selectedTab === "completed" ? completedModules.has(module.id) : !completedModules.has(module.id)
      )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p>Loading training modules...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-red-500">Error loading training modules: {error.message}</p>
            <Button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600 mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Training Modules</h1>
          <p className="text-gray-400">Comprehensive aircraft-specific training for loadmaster operations</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-orange-500">All Modules</TabsTrigger>
            <TabsTrigger value="available" className="data-[state=active]:bg-orange-500">Available</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-orange-500">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map((module: any) => (
                <Card key={module.id} className="bg-gray-800 border-gray-700 hover:border-orange-500 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                          <Plane className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white">{module.title}</CardTitle>
                          <CardDescription className="text-gray-400">{getAircraftDisplayName(module.aircraft)}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={module.difficulty === "Beginner" ? "secondary" : module.difficulty === "Intermediate" ? "default" : "destructive"}>
                        {module.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4">{module.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {module.duration || "2 hours"}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        Reading materials
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {module.topic || "Fundamentals"}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Link href={`/training-modules/${module.id}`}>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          {completedModules.has(module.id) ? "Review" : "Start Training"}
                        </Button>
                      </Link>
                      
                      <div className="flex items-center gap-2">
                        {completedModules.has(module.id) && (
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            <Award className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredModules.length === 0 && (
              <div className="text-center py-12">
                <Plane className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No modules found</h3>
                <p className="text-gray-400">
                  {selectedTab === "completed" 
                    ? "You haven't completed any modules yet." 
                    : "No training modules available at the moment."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}