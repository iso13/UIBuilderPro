import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "./textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Archive, Download, Pencil, Search, Undo, Home, Rocket } from "lucide-react";
import type { Feature, FeatureFilter } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { FeatureGenerationLoader } from "./feature-generation-loader";
import { EditFeatureDialog } from "./edit-feature-dialog";
import { FeatureViewDialog } from "./feature-view-dialog";
import { ScenarioComplexity } from './scenario-complexity';

interface ScenarioData {
  name: string;
  complexity: number;
  factors: {
    stepCount: number;
    dataDependencies: number;
    conditionalLogic: number;
    technicalDifficulty: number;
  };
  explanation: string;
}

interface AnalysisData {
  feature: Feature;
  complexity: {
    scenarios: ScenarioData[];
    recommendations: string[];
  };
  analysis: {
    quality_score: number;
    suggestions: string[];
  };
}

export function FeatureList() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [story, setStory] = useState("");
  const [scenarioCount, setScenarioCount] = useState("1");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [filterOption, setFilterOption] = useState<FeatureFilter>("active");
  const [generationStep, setGenerationStep] = useState<number | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);

  // Filter change handler
  const handleFilterChange = async (value: string) => {
    console.log('Changing filter to:', value);
    setFilterOption(value as FeatureFilter);
    // Invalidate and refetch queries
    await queryClient.invalidateQueries({ queryKey: ["/api/features", value] });
    await queryClient.refetchQueries({ queryKey: ["/api/features", value], exact: true });
  };

  // Features Query
  const { data: features = [], isLoading, error } = useQuery<Feature[]>({
    queryKey: ["/api/features", filterOption],
    queryFn: async () => {
      console.log('Fetching features with filter:', filterOption);
      const response = await apiRequest("GET", `/api/features?filter=${filterOption}`);
      console.log('API Response:', response);
      if (!response) {
        console.error('No response received from API');
        throw new Error("Failed to fetch features");
      }
      console.log('Retrieved', response.length, 'features with filter:', filterOption);
      return response;
    },
  });

  const checkDuplicateTitle = (titleToCheck: string) => {
    if (!titleToCheck) return false;

    const titleExists = features.some(
      feature => feature.title.toLowerCase() === titleToCheck.toLowerCase()
    );

    if (titleExists) {
      const errorMessage = "A feature with this title already exists. Please choose a different title.";
      setTitleError(errorMessage);
      toast({
        title: "Duplicate Feature Title",
        description: errorMessage,
        variant: "destructive",
      });
      return true;
    }

    setTitleError(null);
    return false;
  };

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value) {
      checkDuplicateTitle(value);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Clear error when user starts typing
    if (titleError) {
      setTitleError(null);
    }
  };

  const handleGenerateFeature = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }

    try {
      // Double check for duplicates before submission
      if (checkDuplicateTitle(title)) {
        return;
      }
      await generateFeatureMutation.mutateAsync();
    } catch (error) {
      console.error("Error generating feature:", error);
    }
  };

  // Generate Feature Mutation
  const generateFeatureMutation = useMutation({
    mutationFn: async () => {
      if (!title || !story) {
        throw new Error("Title and story are required");
      }

      setGenerationStep(0);
      const response = await apiRequest("POST", "/api/features", {
        title,
        story,
        scenarioCount: parseInt(scenarioCount),
      });

      setGenerationStep(null);
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
      await queryClient.invalidateQueries({ queryKey: ["/api/features", filterOption] });
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

  // Export Feature Mutation
  const exportFeatureMutation = useMutation({
    mutationFn: async (feature: Feature) => {
      // Create a Blob with the feature content
      const blob = new Blob([feature.generatedContent || ''], { 
        type: 'application/msword' 
      });

      // Create the download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Create sanitized file name from feature title
      const fileName = `${feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.doc`;
      link.setAttribute('download', fileName);

      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Cleanup
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Feature downloaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download feature",
        variant: "destructive",
      });
    },
  });

  const renderFeatureCard = (feature: Feature) => (
    <Card
      className="bg-transparent border-gray-800 h-[180px] w-full cursor-pointer hover:border-gray-700 transition-colors"
      onClick={() => {
        setSelectedFeature(feature);
        setViewDialogOpen(true);
      }}
    >
      <div className="p-4 h-full flex flex-col">
        <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
        <p className="text-sm text-muted-foreground mb-auto line-clamp-3">{feature.story}</p>
        <div className="flex justify-between items-center pt-4">
          <div className="text-xs text-muted-foreground">
            {new Date(feature.createdAt).toLocaleDateString()}
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {filterOption === "deleted" ? (
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
                  onClick={() => exportFeatureMutation.mutate(feature)}
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
  );

  // Format the feature content in the desired structure
  const formatFeatureContent = (title: string, story: string) => {
    const storyLines = story.split('\n');
    const userRole = storyLines.find(line => line.toLowerCase().includes('as a'))?.replace(/^.*?as a/i, '')?.trim() || '';
    const action = storyLines.find(line => line.toLowerCase().includes('i want to'))?.replace(/^.*?want to/i, '')?.trim() || '';
    const benefit = storyLines.find(line => line.toLowerCase().includes('so that'))?.replace(/^.*?so that/i, '')?.trim() || '';

    const tag = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      tag,
      userRole,
      action,
      benefit
    };
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
        {filterOption !== "deleted" && (
          <>
            <div className="mb-8 rounded-lg p-8 bg-transparent border border-gray-800">
              <h2 className="text-2xl font-bold mb-6">Generate New Feature</h2>
              <form onSubmit={handleGenerateFeature} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">Feature Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter feature title"
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    className={`bg-background w-full h-12 text-base ${
                      titleError ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                  {titleError && (
                    <p className="text-sm text-red-500 mt-1">{titleError}</p>
                  )}
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
                <div className="w-64">
                  <Label htmlFor="scenarioCount" className="text-base mb-2 block">Number of Scenarios</Label>
                  <Select value={scenarioCount} onValueChange={setScenarioCount}>
                    <SelectTrigger className="w-full bg-background h-12">
                      <SelectValue placeholder="Number of Scenarios" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} Scenario{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 flex items-center justify-center gap-2 mt-6"
                  disabled={generateFeatureMutation.isPending}
                >
                  <Rocket className="h-4 w-4" />
                  {generateFeatureMutation.isPending ? "Generating..." : "Generate Feature"}
                </Button>
              </form>
            </div>

            {currentAnalysis && (
              <div className="mt-4 mb-8">
                {/* Display the feature title and story */}
                <Card className="bg-transparent border-gray-800">
                  <div className="p-4">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold">{currentAnalysis.feature.title}</h2>
                      <p className="text-muted-foreground mt-2">
                        {currentAnalysis.feature.story}
                      </p>
                    </div>
                    <pre className="font-mono bg-[#1e1e1e] p-4 rounded-lg overflow-x-auto whitespace-pre text-gray-300">
                      {currentAnalysis.feature.generatedContent}
                    </pre>
                  </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {currentAnalysis.complexity.scenarios.map((scenario: ScenarioData, index: number) => (
                    <ScenarioComplexity
                      key={index}
                      name={scenario.name}
                      complexity={scenario.complexity}
                      factors={scenario.factors}
                      explanation={scenario.explanation}
                    />
                  ))}
                </div>

                <Card className="bg-transparent border-gray-800 mt-6">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Recommendations</h2>
                    <ul className="space-y-2">
                      {currentAnalysis.complexity.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="text-muted-foreground">
                          • {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                <Card className="bg-transparent border-gray-800 mt-6">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Quality Analysis</h2>
                    <div className="mb-4">
                      <p className="text-muted-foreground">
                        Quality Score: <span className="text-primary">{currentAnalysis.analysis.quality_score}%</span>
                      </p>
                    </div>
                    <h3 className="font-semibold mb-2">Suggestions for Improvement</h3>
                    <ul className="space-y-2">
                      {currentAnalysis.analysis.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-muted-foreground">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

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
            <Select
              value={filterOption}
              onValueChange={handleFilterChange}
            >
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 max-w-none">
          {!features || features.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">
                {filterOption === "deleted"
                  ? "No archived features found"
                  : "No active features found. Generate your first feature!"}
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
                    {renderFeatureCard(feature)}
                  </motion.div>
                ))}
            </AnimatePresence>
          )}
        </div>

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


        <EditFeatureDialog
          feature={selectedFeature}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
        <FeatureViewDialog
          feature={selectedFeature}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-6">
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
              onClick={() => handleFilterChange("active")}
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          )}
        </div>
        {renderContent()}
        {error && (
          <div className="text-red-500 mt-4">
            Error loading features. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}

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