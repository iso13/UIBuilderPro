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
import { Archive, Download, Pencil, Search, Filter, SlidersHorizontal, Laptop } from "lucide-react";
import type { Feature } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "./progress";
import { ScenarioComplexity } from "./scenario-complexity";
import { FeatureGenerationLoader } from "./feature-generation-loader";
import { EditFeatureDialog } from "./edit-feature-dialog";

// Add type for the response
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

  // Features Query with more aggressive refresh
  const { data: features = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: 1000, // Poll every second while the component is mounted
  });

  // Generate Feature Mutation
  const generateFeatureMutation = useMutation({
    mutationFn: async () => {
      if (!title || !story) {
        throw new Error("Title and story are required");
      }
      setGenerationStep(0); // Start with "Analyzing Input"
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep(1); // Move to "Generating Scenarios"
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await apiRequest("POST", "/api/features", {
        title,
        story,
        scenarioCount: parseInt(scenarioCount),
      });

      setGenerationStep(2); // Move to "Finalizing"
      await new Promise(resolve => setTimeout(resolve, 1000));

      return response as FeatureResponse;
    },
    onSuccess: async (data) => {
      setCurrentAnalysis(data);
      toast({
        title: "Success",
        description: "Feature generated successfully",
      });
      // Clear form fields
      setTitle("");
      setStory("");
      setScenarioCount("1");
      // Force refetch features
      await queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      await queryClient.refetchQueries({ queryKey: ["/api/features"] });
      setGenerationStep(null); // Hide the loader
    },
    onError: (error: Error) => {
      setGenerationStep(null); // Hide the loader
      toast({
        title: "Error",
        description: error.message || "Failed to generate feature",
        variant: "destructive",
      });
    },
  });

  // Delete Feature Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/features/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature deleted",
        description: "The feature has been moved to trash",
      });
    },
  });

  // Copy Feature Mutation
  const copyFeatureMutation = useMutation({
    mutationFn: async (feature: Feature) => {
      return apiRequest("POST", "/api/features", {
        title: `${feature.title} (Copy)`,
        story: feature.story,
        scenarioCount: feature.scenarioCount,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature copied",
        description: "A copy of the feature has been created",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to copy feature",
        variant: "destructive",
      });
    },
  });

  // Export Feature Mutation
  const exportFeatureMutation = useMutation({
    mutationFn: async (featureId: number) => {
      const response = await apiRequest("POST", "/api/features/export-multiple", {
        featureIds: [featureId],
      }, { responseType: 'blob' });

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
      const data = await generateFeatureMutation.mutateAsync();
      console.log("Generated feature with analysis:", data);
    } catch (error) {
      console.error("Error generating feature:", error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="mb-8 rounded-lg p-6 bg-black">
            <h2 className="text-xl font-bold mb-4">Generate New Feature</h2>
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="mb-8 rounded-lg p-6 bg-black">
          <h2 className="text-xl font-bold mb-4">Generate New Feature</h2>
          <form onSubmit={handleGenerateFeature} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Feature Title</Label>
              <Input
                id="title"
                placeholder="Enter feature title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="story">Feature Story</Label>
              <Textarea
                id="story"
                placeholder="Enter feature story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="bg-background min-h-[100px]"
                required
              />
            </div>
            <div className="flex gap-4">
              <Select value={scenarioCount} onValueChange={setScenarioCount}>
                <SelectTrigger className="w-[180px] bg-background">
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
              <Button
                type="submit"
                className="bg-blue-500 text-white"
                disabled={generateFeatureMutation.isPending}
              >
                {generateFeatureMutation.isPending ? "Generating..." : "Generate Feature"}
              </Button>
            </div>
          </form>
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

            {/* Analysis Results */}
            <Card className="bg-black">
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Quality Score</h3>
                    <Progress value={currentAnalysis.analysis.quality_score} className="h-2" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {currentAnalysis.analysis.quality_score}/100
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Suggestions</h3>
                    <ul className="space-y-2">
                      {currentAnalysis.analysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Scenario Complexity</h3>
                    <div className="grid gap-4">
                      {currentAnalysis.complexity.scenarios.map((scenario, index) => (
                        <ScenarioComplexity
                          key={index}
                          name={scenario.name}
                          complexity={scenario.complexity}
                          factors={scenario.factors}
                          explanation={scenario.explanation}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                    <ul className="space-y-2">
                      {currentAnalysis.complexity.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features List Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Generated Features</h2>
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
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Laptop className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
          {!features || features.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No features found. Generate your first feature!</p>
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
                    <Card className="bg-black hover:bg-black/70 transition-colors h-full">
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{feature.title}</h3>
                        <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{feature.story}</p>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(feature.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-white/10"
                              onClick={() => deleteMutation.mutate(feature.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-white/10"
                              onClick={() => {
                                setSelectedFeature(feature);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-white/10"
                              onClick={() => exportFeatureMutation.mutate(feature.id)}
                              disabled={exportFeatureMutation.isPending}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
            </AnimatePresence>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-[1920px] mx-auto py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Feature Generator</h1>
          <p className="text-muted-foreground">Generate Cucumber features using AI</p>
        </div>
        {renderContent()}
      </div>
      <EditFeatureDialog
        feature={selectedFeature}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}