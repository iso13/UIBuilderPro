import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { Archive, Download, Pencil, Search, Undo, Home } from "lucide-react";
import type { Feature, FeatureFilter } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "./progress";
import { ScenarioComplexity } from "./scenario-complexity";
import { FeatureGenerationLoader } from "./feature-generation-loader";
import { EditFeatureDialog } from "./edit-feature-dialog";

interface FeatureResponse {
  feature: Feature;
  complexity: {
    overallComplexity: number;
    scenarios: {
      name: string;
      complexity: number;
      factors: {
        stepCount: number;
        dataDependencies: number;
        conditionalLogic: number;
        technicalDifficulty: number;
      };
      explanation: string;
    }[];
    recommendations: string[];
  };
  analysis: {
    quality_score: number;
    suggestions: string[];
    improved_title?: string;
  };
}

export function FeatureList() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [scenarioCount, setScenarioCount] = useState("1");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentAnalysis, setCurrentAnalysis] = useState<FeatureResponse | null>(null);
  const [generationStep, setGenerationStep] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterOption, setFilterOption] = useState<FeatureFilter>("active");

  // Features Query with archive filter
  const { data: features = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/features", filterOption],
    queryFn: () => apiRequest("GET", `/api/features?filter=${filterOption}`),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 1000,
  });

  // Update the filter change handler
  const handleFilterChange = (value: string) => {
    setFilterOption(value as FeatureFilter);
    // Clear current analysis when switching views
    setCurrentAnalysis(null);
  };

  // Generate Feature Mutation
  const generateFeatureMutation = useMutation({
    mutationFn: async () => {
      if (!title || !story) {
        throw new Error("Title and story are required");
      }
      setGenerationStep(0);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await apiRequest("POST", "/api/features", {
        title,
        story,
        scenarioCount: parseInt(scenarioCount),
      });

      setGenerationStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      return response;
    },
    onSuccess: async (data) => {
      setCurrentAnalysis(data);
      toast({
        title: "Success",
        description: "Feature generated successfully",
      });
      setTitle("");
      setStory("");
      setScenarioCount("1");
      await queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      setGenerationStep(null);
    },
    onError: (error: Error) => {
      setGenerationStep(null);
      toast({
        title: "Error",
        description: error.message || "Failed to generate feature",
        variant: "destructive",
      });
    },
  });

  // Delete (Archive) Feature Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/features/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature archived",
        description: "The feature has been moved to archive",
      });
    },
  });

  // Restore Feature Mutation
  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/features/${id}/restore`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/features", "active"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/features", "deleted"] });
      toast({
        title: "Feature restored",
        description: "The feature has been restored from archive",
      });
      setFilterOption("active");
    },
  });

  // Add exportFeatureMutation right after the restore mutation
  const exportFeatureMutation = useMutation({
    mutationFn: async (featureId: number) => {
      const response = await apiRequest("POST", "/api/features/export-multiple", {
        featureIds: [featureId],
      }, undefined, { responseType: 'blob' });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'feature.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export feature",
        variant: "destructive",
      });
    },
  });

  const handleGenerateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generateFeatureMutation.mutateAsync();
    } catch (error) {
      console.error("Error generating feature:", error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mb-8 rounded-lg p-6 bg-black">
          <h2 className="text-xl font-bold mb-4">Loading...</h2>
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Only show the generation form for active view */}
        {filterOption !== "deleted" && (
          <div className="mb-8 rounded-lg p-8 bg-transparent border border-gray-800">
            <h2 className="text-2xl font-bold mb-6">Generate New Feature</h2>
            <form onSubmit={handleGenerateFeature} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">Feature Title</Label>
                <Input
                  id="title"
                  placeholder="Enter feature title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background w-full h-12 text-base"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="story" className="text-base">Feature Story</Label>
                <Textarea
                  id="story"
                  placeholder="Enter feature story"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  className="bg-background min-h-[150px] w-full text-base"
                  required
                />
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-64">
                  <Label htmlFor="scenarioCount" className="text-base mb-2 block">Number of Scenarios</Label>
                  <Select value={scenarioCount} onValueChange={setScenarioCount}>
                    <SelectTrigger className="w-full bg-background h-12">
                      <SelectValue placeholder="Number of Scenarios" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} Scenario{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 h-12 mt-8"
                  disabled={generateFeatureMutation.isPending}
                >
                  {generateFeatureMutation.isPending ? "Generating..." : "Generate Feature"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Search and filter controls */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {filterOption === "deleted" ? "Archived Features" : "Generated Features"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {features.length} feature{features.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Select value={filterOption} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Features</SelectItem>
                <SelectItem value="deleted">Archived Features</SelectItem>
                <SelectItem value="all">All Features</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 max-w-none">
          {!features || features.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">
                {filterOption === "deleted"
                  ? "No archived features found"
                  : filterOption === "active"
                  ? "No active features found. Generate your first feature!"
                  : "No features found"}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {features
                .filter(feature =>
                  feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  feature.story.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .sort((a, b) => {
                  switch (sortOption) {
                    case 'oldest':
                      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    case 'alphabetical':
                      return a.title.localeCompare(b.title);
                    default: // newest
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  }
                })
                .map((feature) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    layout
                  >
                    <Card className="bg-transparent border-gray-800 h-[180px] w-full">
                      <div className="p-4 h-full flex flex-col">
                        <h3 className="text-base text-gray-200 mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-500 mb-auto line-clamp-3">{feature.story}</p>
                        <div className="flex justify-between items-center pt-4">
                          <div className="text-xs text-gray-600">
                            {new Date(feature.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-1">
                            {feature.deleted ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => restoreMutation.mutate(feature.id)}
                                disabled={restoreMutation.isPending}
                              >
                                <Undo className="h-3 w-3" />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => deleteMutation.mutate(feature.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Archive className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setSelectedFeature(feature);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => exportFeatureMutation.mutate(feature.id)}
                                  disabled={exportFeatureMutation.isPending}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
            </AnimatePresence>
          )}
        </div>
        {/* Feature Generation Status */}
        {generationStep !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-2">Generating Feature</h2>
              <p className="text-muted-foreground mb-6">
                Please wait while we generate your feature content...
              </p>
              <FeatureGenerationLoader currentStep={generationStep} />
            </div>
          </div>
        )}

        {/* Generated Feature Content */}
        {currentAnalysis && (
          <div className="space-y-6">
            <Card className="bg-black">
              <CardHeader>
                <CardTitle>{currentAnalysis.feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">User Story</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {currentAnalysis.feature.story}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Generated Feature</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {currentAnalysis.feature.generatedContent}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-8">
      <div className="text-center mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          {filterOption === "deleted" ? "Archived Features" : "Feature Generator"}
        </h1>
        <p className="text-muted-foreground">
          {filterOption === "deleted"
            ? "View and restore archived features"
            : "Generate Cucumber features using AI"}
        </p>
      </div>
      {filterOption === "deleted" && (
        <Button
          variant="outline"
          className="ml-4"
          onClick={() => setFilterOption("active")}
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-6">
        {renderHeader()}
        {renderContent()}
        <EditFeatureDialog
          feature={selectedFeature}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      </div>
    </div>
  );
}