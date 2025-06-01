
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Target, BookOpen } from "lucide-react";

export default function BestPractices() {
  const practices = [
    {
      id: 1,
      title: "Effective Scenario Design",
      description: "Best practices for creating engaging and educational scenarios",
      category: "Design",
      rating: 5,
      icon: Target
    },
    {
      id: 2,
      title: "Student Engagement Strategies",
      description: "Techniques to keep students motivated and participating",
      category: "Teaching",
      rating: 4,
      icon: Users
    },
    {
      id: 3,
      title: "Assessment and Feedback",
      description: "How to provide constructive feedback that improves learning",
      category: "Assessment",
      rating: 5,
      icon: BookOpen
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Best Practices</h1>
      
      <div className="space-y-6">
        {practices.map((practice) => {
          const IconComponent = practice.icon;
          return (
            <Card key={practice.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-6 h-6 text-blue-500" />
                    <div>
                      <CardTitle>{practice.title}</CardTitle>
                      <CardDescription>{practice.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{practice.category}</Badge>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: practice.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Click to view detailed guidelines and implementation strategies for this best practice.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
