import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { BookOpen, LightbulbIcon, FileText, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InstructorLayout from "@/components/InstructorLayout";

export default function ScenarioResourcesPage() {
  return (
    <InstructorLayout title="Scenario Resources">
      <Helmet>
        <title>Scenario Resources | LOADMworkflow</title>
        <meta name="description" content="Access instructor resources for creating effective loadmaster scenarios" />
      </Helmet>

      <div className="space-y-8">
        <div className="bg-card border border-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Instructor Resources</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">Teaching Materials</CardTitle>
                </div>
                <CardDescription>Access instructor resources and guides</CardDescription>
              </CardHeader>
              <CardContent className="h-20">
                <p className="text-sm text-muted-foreground">
                  Reference materials to help create effective training scenarios for loadmaster students.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/instructors-portal/resources">
                  <Button className="w-full">
                    Access Resources
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LightbulbIcon className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">Best Practices</CardTitle>
                </div>
                <CardDescription>Learn scenario design techniques</CardDescription>
              </CardHeader>
              <CardContent className="h-20">
                <p className="text-sm text-muted-foreground">
                  Guidelines for creating effective assessment questions and training scenarios.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/instructors-portal/best-practices">
                  <Button className="w-full">
                    View Best Practices
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          
          <h3 className="text-xl font-semibold mt-8 mb-4">Downloadable Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-orange-500" />
                  Scenario Template
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm py-2">
                <p className="text-xs text-muted-foreground">
                  Standard format for creating new training scenarios
                </p>
              </CardContent>
              <CardFooter className="pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-orange-500" />
                  Assessment Rubric
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm py-2">
                <p className="text-xs text-muted-foreground">
                  Evaluation criteria for student submissions
                </p>
              </CardContent>
              <CardFooter className="pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-orange-500" />
                  Question Bank
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm py-2">
                <p className="text-xs text-muted-foreground">
                  Sample questions for different aircraft types
                </p>
              </CardContent>
              <CardFooter className="pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}