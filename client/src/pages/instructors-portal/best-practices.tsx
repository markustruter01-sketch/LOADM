import { Helmet } from "react-helmet";
import { LightbulbIcon, CheckSquare, BookOpenCheck, CircleCheck, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import InstructorLayout from "../../components/InstructorLayout";

export default function BestPracticesPage() {
  return (
    <InstructorLayout title="Instructor Best Practices">
      <Helmet>
        <title>Best Practices | LOADMworkflow</title>
        <meta name="description" content="Learn effective scenario design techniques and best practices for assessment" />
      </Helmet>

      <div className="space-y-6">
        <div className="bg-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <LightbulbIcon className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold">Scenario Design Best Practices</h2>
          </div>
          
          <p className="text-muted-foreground mb-8">
            Learn effective techniques for creating challenging, realistic, and educational loadmaster training scenarios.
            These guidelines will help you develop assessment materials that accurately measure student competency.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <CheckSquare className="h-5 w-5 mr-2 text-orange-500" />
                  Creating Effective Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CircleCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Base scenarios on real-world situations and actual aircraft configurations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Include common challenges and edge cases that a loadmaster might encounter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Scale difficulty appropriately based on student experience level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Provide clear objectives and success criteria for each scenario</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <BookOpenCheck className="h-5 w-5 mr-2 text-orange-500" />
                  Assessment Question Design
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CircleCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Create unambiguous questions with single correct answers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Include a mix of calculation, procedure, and decision-making questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Test critical knowledge that directly impacts mission safety</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Provide meaningful feedback for incorrect answers in practice modes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-8" />

          <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-800">
              <AccordionTrigger className="text-base">What makes a scenario challenging without being unrealistic?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Focus on introducing constraints and complications that actually occur in the field, 
                  such as weight distribution challenges, cargo compatibility issues, or time pressure. 
                  Avoid creating impossible situations that would never happen in reality.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-gray-800">
              <AccordionTrigger className="text-base">How many questions should a comprehensive assessment include?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  A typical comprehensive assessment should include 10-15 questions covering different 
                  aspects of the scenario. This provides enough depth to evaluate competency while 
                  keeping the assessment manageable for both students and instructors.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-gray-800">
              <AccordionTrigger className="text-base">What's the best way to provide feedback on student submissions?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Provide specific, actionable feedback that highlights both strengths and areas for 
                  improvement. Reference relevant procedures or calculations when explaining errors, 
                  and suggest specific resources for further study when appropriate.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-gray-800">
              <AccordionTrigger className="text-base">How often should I update scenario content?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Review and update scenario content at least quarterly, or whenever there are significant 
                  changes to procedures, regulations, or equipment. Regular updates keep the training 
                  current and prevent students from memorizing answers rather than understanding concepts.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="flex items-center justify-center p-4">
          <FileText className="h-5 w-5 text-muted-foreground mr-2" />
          <p className="text-sm text-muted-foreground">
            For additional guidance, consult the complete instructor handbook
          </p>
        </div>
      </div>
    </InstructorLayout>
  );
}