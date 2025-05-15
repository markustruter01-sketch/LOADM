import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Document, Scenario } from "@shared/schema";
import { Button } from "@/components/ui/button";
import DocumentCard from "@/components/DocumentCard";
import ScenarioCard from "@/components/ScenarioCard";
import { Loader2, FileText, ClipboardList } from "lucide-react";

export default function HomePage() {
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    staleTime: 30000, // 30 seconds
  });

  const { data: scenarios, isLoading: isLoadingScenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
    staleTime: 30000, // 30 seconds
  });

  return (
    <>
      <Helmet>
        <title>LOADMdocs - Professional Loadmaster Documentation App</title>
        <meta 
          name="description" 
          content="Professional documentation and scenario tools for loadmasters. Access required documentation and training scenarios in one central location." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <section className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Welcome to <span className="text-primary">LOADMdocs</span>
            </h2>
            <p className="text-muted-foreground mb-6">
              Professional documentation and scenario tools for loadmasters
            </p>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
              <Link href="/documents">
                <div className="flex-1">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white h-16"
                    size="lg"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Documents
                  </Button>
                </div>
              </Link>
              <Link href="/scenarios">
                <div className="flex-1">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white h-16"
                    size="lg"
                  >
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Scenarios
                  </Button>
                </div>
              </Link>
            </div>

            {/* Featured Section Banner */}
            <div className="relative rounded-xl overflow-hidden shadow-xl mb-10 h-64">
              <img
                src="https://pixabay.com/get/gf072876aa3b430280d49278783214995ecc68ab38621f3d55b9bc7463c63b94edc78cd06c528f4d416da65fc74c979a893ac56dfcf7b58b8707fdee6a90a83e0_1280.jpg"
                alt="Aircraft cargo loading"
                className="w-full h-full object-cover"
              />
              <div className="gradient-overlay flex items-end">
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Streamline Your Loadmaster Documentation
                  </h3>
                  <p className="text-muted-foreground max-w-xl">
                    Access all required documentation and training scenarios in one central location.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Documents Section */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Recent Documents</h3>
              <Link href="/documents">
                <span className="text-primary hover:underline text-sm cursor-pointer">View All</span>
              </Link>
            </div>
            {isLoadingDocuments ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents?.slice(0, 2).map((document) => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            )}
          </section>

          {/* Recent Scenarios Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Recent Scenarios</h3>
              <Link href="/scenarios">
                <a className="text-primary hover:underline text-sm">View All</a>
              </Link>
            </div>
            {isLoadingScenarios ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scenarios?.slice(0, 2).map((scenario) => (
                  <ScenarioCard key={scenario.id} scenario={scenario} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
