import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Clock, Target, BookOpen, Play, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrainingModule {
  id: number;
  title: string;
  description: string;
  aircraft: string;
  difficulty: string;
  duration: string;
  topics: string[];
  objectives: string[];
  reading_content?: string;
  video_content?: string;
  interactive_content?: string;
  quiz_content?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function TrainingModuleDetail() {
  const [match, params] = useRoute("/training-modules/:id");
  const moduleId = params?.id;

  const { data: module, isLoading, error } = useQuery<TrainingModule>({
    queryKey: ['/api/training-modules', moduleId],
    enabled: !!moduleId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#1e1e1e' }}>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 rounded mb-4 w-1/3" style={{ backgroundColor: '#374151' }}></div>
            <div className="h-12 rounded mb-6 w-2/3" style={{ backgroundColor: '#374151' }}></div>
            <div className="grid gap-6">
              <div className="h-64 rounded" style={{ backgroundColor: '#374151' }}></div>
              <div className="h-32 rounded" style={{ backgroundColor: '#374151' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#1e1e1e' }}>
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Module Not Found</h1>
          <p className="text-gray-300 mb-6">The requested training module could not be found.</p>
          <Link href="/training-modules">
            <Button style={{ backgroundColor: '#ff8c00', color: '#ffffff' }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Training Modules
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#1e1e1e' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/training-modules">
            <Button variant="ghost" className="mb-4 text-white hover:text-orange-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Training Modules
            </Button>
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{module.title}</h1>
              <p className="text-gray-300 text-lg">{module.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize" style={{ backgroundColor: '#ff8c00', color: '#ffffff' }}>
                {module.aircraft.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Badge>
              <Badge variant="outline" className="capitalize text-white border-white">
                {module.difficulty}
              </Badge>
              <Badge variant="outline" className="text-white border-white">
                <Clock className="w-3 h-3 mr-1" />
                {module.duration}
              </Badge>
            </div>
          </div>
        </div>

        {/* Course Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2" style={{ backgroundColor: '#2d2d2d', borderColor: '#374151' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="w-5 h-5 mr-2 text-orange-400" />
                Learning Objectives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {module.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start text-gray-300">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                    {objective}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#2d2d2d', borderColor: '#374151' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-orange-400" />
                Course Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {module.topics.map((topic, index) => (
                  <Badge key={index} variant="outline" className="text-gray-300 border-gray-500">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Card style={{ backgroundColor: '#2d2d2d', borderColor: '#374151' }}>
          <CardContent className="p-0">
            <Tabs defaultValue="reading" className="w-full">
              <TabsList className="grid w-full grid-cols-4" style={{ backgroundColor: '#374151' }}>
                <TabsTrigger value="reading" className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Reading
                </TabsTrigger>
                <TabsTrigger value="videos" className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="interactive" className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Interactive
                </TabsTrigger>
                <TabsTrigger value="assessment" className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assessment
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="reading" className="mt-0">
                  <div className="prose prose-invert max-w-none">
                    <h3 className="text-xl font-semibold text-white mb-4">Reading Materials</h3>
                    <p className="text-gray-300 mb-6">Comprehensive study materials for this module</p>
                    
                    {module.reading_content ? (
                      <div className="space-y-4">
                        <div style={{ backgroundColor: '#374151' }} className="rounded-lg p-4">
                          <h4 className="text-lg font-medium text-white mb-2">
                            {module.title} - Study Guide
                          </h4>
                          <p className="text-gray-300 text-sm mb-3">
                            {module.description}
                          </p>
                          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {module.reading_content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Reading materials will be available soon</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="videos" className="mt-0">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white mb-4">Video Training</h3>
                    <p className="text-gray-300 mb-6">Interactive video content and demonstrations</p>
                    
                    {module.video_content ? (
                      <div className="space-y-4">
                        <div style={{ backgroundColor: '#374151' }} className="rounded-lg p-4">
                          <h4 className="text-lg font-medium text-white mb-2">Training Videos</h4>
                          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {module.video_content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Video content will be available soon</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="interactive" className="mt-0">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white mb-4">Interactive Training</h3>
                    <p className="text-gray-300 mb-6">Hands-on exercises and simulations</p>
                    
                    {module.interactive_content ? (
                      <div className="space-y-4">
                        <div style={{ backgroundColor: '#374151' }} className="rounded-lg p-4">
                          <h4 className="text-lg font-medium text-white mb-2">Interactive Exercises</h4>
                          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {module.interactive_content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Interactive content will be available soon</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="assessment" className="mt-0">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white mb-4">Assessment</h3>
                    <p className="text-gray-300 mb-6">Test your knowledge and skills</p>
                    
                    {module.quiz_content ? (
                      <div className="space-y-4">
                        <div style={{ backgroundColor: '#374151' }} className="rounded-lg p-4">
                          <h4 className="text-lg font-medium text-white mb-2">Knowledge Assessment</h4>
                          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {module.quiz_content}
                          </div>
                        </div>
                        <Button className="w-full" style={{ backgroundColor: '#ff8c00', color: '#ffffff' }}>
                          Start Assessment
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Assessment will be available soon</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}