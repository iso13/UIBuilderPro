import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./card";
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
import { Copy, Trash2, Edit } from "lucide-react";
import type { Feature } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "./progress";
import { ScenarioComplexity } from "./scenario-complexity";

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
      const response = await apiRequest("POST", "/api/features", {
        title,
        story,
        scenarioCount: parseInt(scenarioCount),
      });
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
    },
    onError: (error: Error) => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-black rounded-lg p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
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

        {/* Analysis Section */}
        {currentAnalysis && (
          <div className="mt-8 space-y-6">
            <Card className="bg-black p-6">
              <h2 className="text-xl font-bold mb-4">Analysis Results</h2>

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
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {!features || features.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No features found. Generate your first feature!</p>
            </div>
          ) : (
            <AnimatePresence>
              {features.map((feature) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                >
                  <Card className="bg-black hover:bg-black/70 transition-colors h-full">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/10"
                            onClick={() => copyFeatureMutation.mutate(feature)}
                            disabled={copyFeatureMutation.isPending}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/10"
                            onClick={() => deleteMutation.mutate(feature.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/10"
                            onClick={() => navigate(`/edit/${feature.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 line-clamp-3">{feature.story}</p>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(feature.createdAt).toLocaleDateString()}
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
      <div className="container mx-auto py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Feature Generator</h1>
          <p className="text-muted-foreground">Generate Cucumber features using AI</p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}