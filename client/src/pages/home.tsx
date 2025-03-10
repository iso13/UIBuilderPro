import { useState, useMemo, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wand2, Search, SortAsc, Edit2, Archive, RefreshCw, HelpCircle, Activity, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { insertFeatureSchema, type InsertFeature, type Feature, type SortOption, updateFeatureSchema } from "@shared/schema";
import * as z from 'zod';
import { useCheckDuplicateTitle } from "@/hooks/use-check-duplicate-title";
import { CucumberGuide } from "@/components/ui/cucumber-guide";
import { ScenarioComplexity } from "@/components/ui/scenario-complexity";
import { FeatureGenerationLoader } from "@/components/ui/feature-generation-loader";

type FeatureFilter = "all" | "active" | "deleted";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentFeature, setCurrentFeature] = useState<Feature | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date");
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isContentEdited, setIsContentEdited] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterOption, setFilterOption] = useState<FeatureFilter>("active");
  const [showGuide, setShowGuide] = useState(false);

  const form = useForm<InsertFeature>({
    resolver: zodResolver(insertFeatureSchema),
    defaultValues: {
      title: "",
      story: "",
      scenarioCount: 1,
    },
    mode: "onChange",
  });

  const title = form.watch("title");
  const { isDuplicate, isChecking } = useCheckDuplicateTitle(title);

  useEffect(() => {
    if (isDuplicate) {
      form.setError("title", {
        type: "manual",
        message: "A feature with this title already exists. Please use a different title."
      });
    } else {
      form.clearErrors("title");
    }
  }, [isDuplicate, form]);

  const { data: features = [] } = useQuery<Feature[]>({
    queryKey: ["/api/features", { includeDeleted: filterOption === "all" || filterOption === "deleted" }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterOption === "all" || filterOption === "deleted") {
        params.append("includeDeleted", "true");
      }
      const res = await apiRequest("GET", `/api/features?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch features");
      }
      return res.json();
    },
  });

  const filteredAndSortedFeatures = useMemo(() => {
    let result = [...features];

    if (searchQuery) {
      result = result.filter(feature =>
        feature.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterOption === "active") {
      result = result.filter(feature => !feature.deleted);
    } else if (filterOption === "deleted") {
      result = result.filter(feature => feature.deleted);
    }

    result.sort((a, b) => {
      if (sortOption === "title") {
        return a.title.localeCompare(b.title);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [features, searchQuery, sortOption, filterOption]);

  const generateMutation = useMutation({
    mutationFn: async (data: InsertFeature) => {
      setIsGenerating(true);
      setGenerationStep(0);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await apiRequest("POST", "/api/features/generate", data);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      setGenerationStep(2);
      await new Promise(resolve => setTimeout(resolve, 500));

      return res.json();
    },
    onSuccess: (data) => {
      setCurrentFeature(data);
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      form.reset();
      toast({
        title: "Success",
        description: "Feature generated successfully",
        duration: 3000,
      });
      setIsGenerating(false);
      setGenerationStep(0);
    },
    onError: (error) => {
      toast({
        title: "Cannot Generate Feature",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
      setIsGenerating(false);
      setGenerationStep(0);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: { id: number } & Partial<InsertFeature & { generatedContent?: string }>) => {
      const res = await apiRequest(
        "PATCH",
        `/api/features/${data.id}`,
        {
          title: data.title,
          story: data.story,
          scenarioCount: data.scenarioCount,
          generatedContent: data.generatedContent,
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      setEditingFeature(null);
      setIsContentEdited(false);
      toast({
        title: "Success",
        description: "Feature updated successfully",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Cannot Update Feature",
        description: error.message,
        duration: 5000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/features/${id}/delete`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Success",
        description: "Feature has been archived",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/features/${id}/restore`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Success",
        description: "Feature restored successfully",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const editForm = useForm<InsertFeature & { generatedContent: string }>({
    resolver: zodResolver(updateFeatureSchema),
    defaultValues: {
      title: "",
      story: "",
      scenarioCount: 2,
      generatedContent: "",
    },
  });

  useEffect(() => {
    if (editingFeature) {
      editForm.reset({
        title: editingFeature.title,
        story: editingFeature.story,
        scenarioCount: editingFeature.scenarioCount,
        generatedContent: editingFeature.generatedContent || "",
      });
      setIsContentEdited(editingFeature.manuallyEdited || false);
    }
  }, [editingFeature, editForm]);

  const onSubmit = (data: InsertFeature) => {
    generateMutation.mutate(data);
  };

  const onEdit = (data: InsertFeature & { generatedContent: string }) => {
    if (!editingFeature) return;
    editMutation.mutate({ id: editingFeature.id, ...data });
  };


  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 py-8"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Feature Generator
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setShowGuide(true)}
            >
              <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">
            Generate Cucumber features using AI
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Generate New Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Title</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter feature title"
                            {...field}
                            className={`${isDuplicate ? "border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500" : ""}`}
                          />
                          {isChecking && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <LoadingSpinner />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <div className={`${isDuplicate ? "text-red-500 dark:text-red-500" : ""}`}>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="story"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Story</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter feature story"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scenarioCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Scenarios</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of scenarios" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner />
                      Generating...
                    </span>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Feature
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {currentFeature && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentFeature.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Story</h4>
                  <p className="text-sm text-muted-foreground">{currentFeature.story}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Generated Content</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-sm">
                    {currentFeature.generatedContent}
                  </pre>
                </div>
                <div className="mt-6 border-t pt-6">
                  <ComplexityAnalysis featureId={currentFeature.id} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Generated Features</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredAndSortedFeatures.length} feature{filteredAndSortedFeatures.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select
                value={filterOption}
                onValueChange={(value: FeatureFilter) => setFilterOption(value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter features" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  <SelectItem value="active">Active Features</SelectItem>
                  <SelectItem value="deleted">Archived Features</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SortAsc className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOption("title")}>
                    Sort by Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("date")}>
                    Sort by Date
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {filteredAndSortedFeatures.map((feature: Feature) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                      currentFeature?.id === feature.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setCurrentFeature(feature)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h3 className="text-lg font-semibold truncate pr-2">{feature.title}</h3>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{feature.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {feature.story}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(feature.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  feature.deleted
                                    ? restoreMutation.mutate(feature.id)
                                    : deleteMutation.mutate(feature.id);
                                }}
                              >
                                {feature.deleted ? (
                                  <RefreshCw className="h-4 w-4" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {feature.deleted ? "Restore Feature" : "Archive Feature"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFeature(feature);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Edit Feature
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredAndSortedFeatures.length === 0 && (
                <div className="text-center text-muted-foreground col-span-full">
                  {searchQuery ? "No features found matching your search." : "No features generated yet. Try generating one above!"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={editingFeature !== null} onOpenChange={(open) => !open && setEditingFeature(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Feature</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-6">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter feature title"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            const currentContent = editForm.getValues("generatedContent");
                            if (currentContent) {
                              const updatedContent = updateFeatureContent(currentContent, e.target.value);
                              editForm.setValue("generatedContent", updatedContent);
                              setIsContentEdited(true);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="story"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Story</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter feature story"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="scenarioCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Scenarios</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of scenarios" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="generatedContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter Gherkin feature content"
                          className="min-h-[300px] font-mono"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setIsContentEdited(true);
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isContentEdited
                          ? "This feature has been manually edited"
                          : "Edit the content directly to customize scenarios and steps"}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingFeature(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editMutation.isPending}
                  >
                    {editMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner />
                        Updating...
                      </span>
                    ) : (
                      "Update Feature"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isGenerating} onOpenChange={(open) => !open && setIsGenerating(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generating Feature</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Please wait while we generate your feature content...
              </p>
            </DialogHeader>
            <div className="py-6">
              <FeatureGenerationLoader currentStep={generationStep} />
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showGuide} onOpenChange={setShowGuide}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Learn BDD with Cucumber</DialogTitle>
            </DialogHeader>
            <CucumberGuide />
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}

function updateFeatureContent(content: string, newTitle: string): string {
  const featureTag = `@${newTitle
    .split(/\s+/)
    .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1))
    .join('')}`;

  let updatedContent = content
    .replace(/@[\w]+\n/, `${featureTag}\n`)
    .replace(/Feature:.*\n/, `Feature: ${newTitle}\n`);

  return updatedContent;
}

function ComplexityAnalysis({ featureId }: { featureId: number }) {
  const { data: complexity, isLoading, refetch } = useQuery({
    queryKey: ['/api/features/complexity', featureId],
    queryFn: async () => {
      const res = await apiRequest(
        'POST',
        `/api/features/${featureId}/complexity`
      );
      if (!res.ok) {
        throw new Error('Failed to analyze complexity');
      }
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!complexity) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Scenario Complexity Analysis
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Analyzing...
            </div>
          ) : (
            'Refresh Analysis'
          )}
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {complexity.scenarios.map((scenario: {
          name: string;
          complexity: number;
          factors: {
            stepCount: number;
            dataDependencies: number;
            conditionalLogic: number;
            technicalDifficulty: number;
          };
          explanation: string;
        }) => (
          <ScenarioComplexity
            key={scenario.name}
            name={scenario.name}
            complexity={scenario.complexity}
            factors={scenario.factors}
            explanation={scenario.explanation}
          />
        ))}
      </div>
      {complexity.recommendations && complexity.recommendations.length > 0 && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h5 className="font-medium mb-2">Recommendations</h5>
          <ul className="space-y-2">
            {complexity.recommendations.map((rec: string, index: number) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <ArrowRight className="h-4 w-4 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}