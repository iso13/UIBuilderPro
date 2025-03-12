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

export function FeatureList() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [scenarioCount, setScenarioCount] = useState("1");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logoutMutation } = useAuth();

  const { data: features = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
  });
  
  // Function to copy feature content to clipboard
  const copyFeature = async (feature: Feature) => {
    if (feature.generatedContent) {
      await navigator.clipboard.writeText(feature.generatedContent);
      toast({
        title: "Copied to clipboard",
        description: `Feature "${feature.title}" copied to clipboard`,
        variant: "default",
      });
    }
  };
  
  // Function to navigate to feature edit page
  const editFeature = (feature: Feature) => {
    navigate(`/feature/${feature.id}`);
  };
  
  // Function to delete a feature
  const deleteFeature = async (feature: Feature) => {
    if (confirm(`Are you sure you want to delete "${feature.title}"?`)) {
      try {
        await apiRequest({
          url: `/api/features/${feature.id}`,
          method: 'DELETE',
        });
        
        toast({
          title: "Feature deleted",
          description: `"${feature.title}" has been moved to trash`,
          variant: "default",
        });
        
        // Refresh the features list
        queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete feature",
          variant: "destructive",
        });
      }
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/features/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature deleted",
        description: "The feature has been moved to trash",
      });
    },
  });

  const copyFeature = async (feature: Feature) => {
    try {
      await apiRequest("POST", "/api/features", {
        title: `${feature.title} (Copy)`,
        story: feature.story,
        scenarioCount: feature.scenarioCount,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature copied",
        description: "A copy of the feature has been created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy feature",
        variant: "destructive",
      });
    }
  };

  const handleGenerateFeature = async () => {
    if (!title || !story) {
      toast({
        title: "Missing information",
        description: "Please provide a title and story for the feature",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/features", {
        title,
        story,
        scenarioCount: parseInt(scenarioCount),
      });

      toast({
        title: "Success",
        description: "Feature generated successfully",
      });

      setTitle("");
      setStory("");
      setScenarioCount("1");
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate feature",
        variant: "destructive",
      });
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Feature Title</Label>
              <Input
                id="title"
                placeholder="Enter feature title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background"
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
                      {num} Scenario{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerateFeature}
                className="bg-blue-500 text-white"
              >
                Generate Feature
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
                >
                  <Card className="bg-black hover:bg-black/70 transition-colors cursor-pointer h-full">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {feature.story}
                      </p>
                      <div className="text-xs text-muted-foreground mt-auto flex items-center gap-2">
                        <span className="text-primary">
                          {feature.scenarioCount || 0} scenarios
                        </span>
                        <span>•</span>
                        <span>{new Date(feature.createdAt).toLocaleDateString()}</span>
                      </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/10"
                            onClick={() => copyFeature(feature)}
                            title="Copy feature"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/10"
                            onClick={() => editFeature(feature)}
                            title="Edit feature"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/10 text-red-500 hover:text-red-400"
                            onClick={() => deleteMutation.mutate(feature.id)}
                            title="Delete feature"
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
      {/* Navigation Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex gap-6">
            <Button 
              variant="ghost" 
              className="text-white hover:text-blue-400"
              onClick={() => navigate("/")}
            >
              Home
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:text-blue-400"
              onClick={() => navigate("/analytics")}
            >
              Analytics
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white">{user?.email}</span>
            <Button 
              variant="ghost" 
              className="text-white hover:text-blue-400"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

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