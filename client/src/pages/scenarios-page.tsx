import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Scenario } from "@shared/schema";
import { Loader2, ArrowLeft, Book, FileCheck, HelpCircle, Download } from "lucide-react";
import { downloadScenariosPDF } from "@/lib/pdf-download";
import ScenarioCard from "@/components/ScenarioCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ScenariosPage() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("training");
  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });
  
  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ["/api/quizzes", "activeOnly"],
    queryFn: ({ signal }) => fetch('/api/quizzes?activeOnly=true', { signal, credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .catch(() => [])
  });

  const handleBackClick = () => {
    navigate("/");
  };

  return (
    <>
      <Helmet>
        <title>Scenarios - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Access and complete loadmaster training scenarios." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Back Button + Download */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackClick}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
              disabled={isLoading || quizzesLoading}
              onClick={() => downloadScenariosPDF(
                (scenarios ?? []).map(s => ({
                  title: s.title,
                  description: s.description ?? undefined,
                  numberOfQuestions: s.numberOfQuestions ?? undefined,
                  passingThreshold: s.passingThreshold ?? undefined,
                })),
                (quizzes ?? []).map((q: any) => ({
                  title: q.title,
                  description: q.description ?? undefined,
                  questionCount: q.questionCount ?? q.question_count ?? undefined,
                  passingThreshold: q.passingThreshold ?? q.passing_threshold ?? undefined,
                  expiresAt: q.expiresAt ?? q.expires_at ?? undefined,
                }))
              )}
            >
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          </div>

          {/* Header Section */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Scenarios
            </h2>
            <p className="text-muted-foreground mb-6">
              Access and complete loadmaster training scenarios
            </p>
          </section>

            {/* Tab navigation */}
          <div className="flex flex-col gap-6 mb-6">
            <div className="bg-muted p-1 rounded-lg inline-flex self-start">
              <button 
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'training' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab("training")}
              >
                <Book className="h-4 w-4 mr-2 inline-block" />
                Training
              </button>
              <button 
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'assessment' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab("assessment")}
              >
                <FileCheck className="h-4 w-4 mr-2 inline-block" />
                Assessment
              </button>
              <button 
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'quiz' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab("quiz")}
              >
                <HelpCircle className="h-4 w-4 mr-2 inline-block" />
                Quiz
              </button>
            </div>
            
            {/* Training mode notice */}
            {activeTab === 'training' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700">
                <span className="font-medium">Note:</span> Scenarios completed under the Training section will not be submitted for review.
              </div>
            )}

            {/* Assessment mode notice */}
            {activeTab === 'assessment' && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 text-sm text-orange-500">
                <span className="font-medium">Note:</span> These assessments are recorded and will be submitted to instructors for review and grading.
              </div>
            )}
          </div>
          
          {/* Scenarios Grid */}
          <section>
            {isLoading && activeTab !== "quiz" ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : quizzesLoading && activeTab === "quiz" ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {activeTab === "training" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {scenarios?.map((scenario) => (
                      <ScenarioCard key={`training-${scenario.id}`} scenario={scenario} activeTab="training" />
                    ))}
                  </div>
                )}
                
                {activeTab === "assessment" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {scenarios?.map((scenario) => (
                      <ScenarioCard key={`assessment-${scenario.id}`} scenario={scenario} activeTab="assessment" />
                    ))}
                  </div>
                )}
                
                {activeTab === "quiz" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quizzes && quizzes.length > 0 ? (
                      quizzes.map((quiz: any) => (
                        <div key={`quiz-${quiz.id}`} className="bg-card rounded-lg border border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
                          <div className="bg-orange-600/10 p-4 border-b border-gray-800">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-semibold text-foreground">{quiz.title}</h3>
                              {quiz.isActive ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-500">Active</span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">Inactive</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quiz.description || "No description"}</p>
                          </div>
                          <div className="p-4">
                            <div className="flex flex-col gap-2 mb-4">
                              <div className="text-sm flex items-center justify-between">
                                <span className="text-muted-foreground">Questions:</span>
                                <span className="font-medium">{quiz.question_count || 'N/A'}</span>
                              </div>
                              {quiz.expiresAt && (
                                <div className="text-sm flex items-center justify-between">
                                  <span className="text-muted-foreground">Expires:</span>
                                  <span className="font-medium">{new Date(quiz.expiresAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-4">
                              {quiz.categories && quiz.categories.slice(0, 3).map((category: string, i: number) => (
                                <span key={i} className="px-2 py-1 text-xs rounded-full bg-orange-500/10 text-orange-500">
                                  {category.replace(/-/g, ' ')}
                                </span>
                              ))}
                              {quiz.categories && quiz.categories.length > 3 && (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-500/10 text-gray-400">
                                  +{quiz.categories.length - 3} more
                                </span>
                              )}
                            </div>
                            <div className="flex justify-end">
                              <Button 
                                onClick={() => navigate(`/quizzes/${quiz.id}`)}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                Take Quiz
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 bg-card rounded-lg border border-gray-800 p-8 text-center">
                        <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Quizzes Available</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          There are currently no quizzes available. Check back later for new knowledge tests.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}