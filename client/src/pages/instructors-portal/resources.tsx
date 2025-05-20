import { Helmet } from "react-helmet";
import { BookOpen, FileDown, FileText, ArrowDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import InstructorLayout from "../../components/InstructorLayout";

export default function TeachingMaterialsPage() {
  return (
    <InstructorLayout title="Teaching Materials">
      <Helmet>
        <title>Teaching Materials | LOADMworkflow</title>
        <meta name="description" content="Access instructor resources and teaching materials for loadmaster training" />
      </Helmet>

      <div className="space-y-6">
        <div className="bg-card border border-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Instructor Resources</h2>
          <p className="text-muted-foreground mb-6">
            Access teaching materials, reference guides, and training resources to help you create effective loadmaster training scenarios.
          </p>

          <h3 className="text-xl font-semibold mb-3">Reference Materials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-500" />
                  Loadmaster Training Guide
                </CardTitle>
                <CardDescription>Comprehensive instruction manual</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground py-2">
                Complete reference guide covering all aspects of loadmaster duties and responsibilities.
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-500" />
                  Aircraft Loading Specifications
                </CardTitle>
                <CardDescription>Technical reference documents</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground py-2">
                Detailed specifications for cargo loading across different aircraft types.
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardFooter>
            </Card>
          </div>

          <h3 className="text-xl font-semibold mb-3">Teaching Aids</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-orange-500" />
                  Scenario Design Templates
                </CardTitle>
                <CardDescription>Ready-to-use training templates</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground py-2">
                Pre-structured scenario templates for common training situations.
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Access Templates
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-orange-500" />
                  Instructor Presentation Slides
                </CardTitle>
                <CardDescription>Classroom teaching resources</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground py-2">
                Presentation materials for various loadmaster training topics.
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Slides
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Need additional resources? Contact the training department
          </p>
        </div>
      </div>
    </InstructorLayout>
  );
}