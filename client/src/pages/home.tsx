import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Wand2, Search, SortAsc, Edit2, Archive, RefreshCw, Activity, ArrowRight, Download, Trash2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react"; //Corrected import


function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    title: "",
    description: "",
    scenario: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Get user info
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  // Fetch all features
  const { data: features = [], isLoading } = useQuery({
    queryKey: ["features", showArchived],
    queryFn: async () => {
      const res = await fetch(`/api/features?showArchived=${showArchived}`);
      if (!res.ok) throw new Error("Failed to fetch features");
      return res.json();
    },
  });

  // Archive a feature, Restore a feature, Delete a feature, Generate a new feature, and Export features remain largely unchanged from the original

  const archiveMutation = useMutation({
    mutationFn: async (featureId) => {
      const res = await fetch(`/api/features/${featureId}/archive`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to archive feature");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["features"]);
      toast({
        title: "Success",
        description: "Feature archived",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (featureId) => {
      const res = await fetch(`/api/features/${featureId}/restore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restore feature");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["features"]);
      toast({
        title: "Success",
        description: "Feature restored",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (featureId) => {
      const res = await fetch(`/api/features/${featureId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete feature");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["features"]);
      toast({
        title: "Success",
        description: "Feature deleted permanently",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      setIsGenerating(true);
      const res = await fetch("/api/features/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate feature");
      return res.json();
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      queryClient.invalidateQueries(["features"]);
      setIsFeatureDialogOpen(false);
      setNewFeature({
        title: "",
        description: "",
        scenario: "",
      });
      toast({
        title: "Success",
        description: "Feature generated successfully",
      });
      navigate(`/feature/${data.id}`);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExport = async () => {
    try {
      const res = await fetch("/api/features/export");
      if (!res.ok) throw new Error("Failed to export features");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "features.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Features exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredFeatures = features.filter((feature) =>
    feature.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFeatures = [...filteredFeatures].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-8">Generated Features</h1>
      <p className="text-muted-foreground mb-8">Browse your AI-generated features</p>
      <div className="grid gap-6">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setSortBy(sortBy === "date" ? "title" : "date")}
            >
              <SortAsc className="h-4 w-4" />
              Sort by {sortBy === "date" ? "Date" : "Title"}
            </Button>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showArchived"
                checked={showArchived}
                onCheckedChange={(checked) => setShowArchived(checked)}
              />
              <Label htmlFor="showArchived">Show Archived</Label>
            </div>
            <Button
              variant="default"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setIsFeatureDialogOpen(true)}>
              <Wand2 className="h-4 w-4" />
              Generate New Feature
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {filteredFeatures.length} features found
        </p>

        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <p>Loading features...</p>
          ) : sortedFeatures.length === 0 ? (
            <p>No features found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedFeatures.map((feature) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="col-span-1"
                >
                  <Card className={feature.archived ? "border-dashed opacity-70" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/feature/${feature.id}`)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!feature.archived ? (
                              <DropdownMenuItem onClick={() => archiveMutation.mutate(feature.id)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => restoreMutation.mutate(feature.id)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Restore
                              </DropdownMenuItem>
                            )}
                            {user?.role === "ADMIN" && (
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => deleteMutation.mutate(feature.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 pb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Activity className="mr-1 h-4 w-4" />
                        {new Date(feature.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/feature/${feature.id}`)}
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Generate New Feature</DialogTitle>
            <DialogDescription>
              Describe your feature need, and our AI will generate it for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Feature Title</Label>
              <Input
                id="title"
                placeholder="E.g., User Authentication System"
                value={newFeature.title}
                onChange={(e) =>
                  setNewFeature({ ...newFeature, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Brief Description</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe what this feature should do..."
                rows={2}
                value={newFeature.description}
                onChange={(e) =>
                  setNewFeature({ ...newFeature, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario">User Scenario</Label>
              <Textarea
                id="scenario"
                placeholder="Describe the scenario where this feature would be used. E.g., 'As a product manager, I want to...'"
                rows={4}
                value={newFeature.scenario}
                onChange={(e) =>
                  setNewFeature({ ...newFeature, scenario: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFeatureDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={() => generateMutation.mutate(newFeature)}
              disabled={
                isGenerating ||
                !newFeature.title ||
                !newFeature.description ||
                !newFeature.scenario
              }
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Home;