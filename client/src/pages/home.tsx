import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, SortAsc, MoreVertical as MoreVerticalIcon } from "lucide-react";
// Placeholder for useToast -  replace with actual implementation
const useToast = () => ({ toast: (params) => console.log("Toast:", params) });

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";

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

  // Archive a feature
  const archiveFeature = async (id) => {
    try {
      const res = await fetch(`/api/features/${id}/archive`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to archive feature");
      queryClient.invalidateQueries(["features"]);
      toast({
        title: "Feature archived",
        description: "The feature has been moved to archives",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive feature",
        variant: "destructive",
      });
    }
  };

  // Restore a feature
  const restoreFeature = async (id) => {
    try {
      const res = await fetch(`/api/features/${id}/restore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restore feature");
      queryClient.invalidateQueries(["features"]);
      toast({
        title: "Feature restored",
        description: "The feature has been restored from archives",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore feature",
        variant: "destructive",
      });
    }
  };

  // Delete a feature
  const deleteFeature = async (id) => {
    try {
      const res = await fetch(`/api/features/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete feature");
      queryClient.invalidateQueries(["features"]);
      toast({
        title: "Feature deleted",
        description: "The feature has been permanently deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      });
    }
  };

  // Generate a new feature
  const generateFeature = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch("/api/features/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newFeature.title,
          description: newFeature.description,
          scenario: newFeature.scenario,
          scenarioCount: 3,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate feature");
      }

      setIsFeatureDialogOpen(false);
      setNewFeature({
        title: "",
        description: "",
        scenario: "",
      });
      queryClient.invalidateQueries(["features"]);
      toast({
        title: "Feature generated",
        description: "A new feature has been created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate feature",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Export features
  const handleExport = async () => {
    try {
      const res = await fetch(`/api/features/export?showArchived=${showArchived}`);
      if (!res.ok) throw new Error("Failed to export features");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "exported-features.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Features exported",
        description: "All features have been exported as a zip file",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export features",
        variant: "destructive",
      });
    }
  };

  // Filter features based on search query
  const filteredFeatures = features.filter((feature) => {
    return (
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Sort features based on sort option
  const sortedFeatures = [...filteredFeatures].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-8">Generated Features</h1>
      <p className="text-muted-foreground mb-8">{features.length} features found</p>
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
                onCheckedChange={(checked) => setShowArchived(checked === true)}
              />
              <Label htmlFor="showArchived">Show Archived</Label>
            </div>
            <Button
              variant="default"
              onClick={handleExport}
            >
              Export Features
            </Button>
            <Button
              variant="default"
              onClick={() => setIsFeatureDialogOpen(true)}
            >
              Generate New Feature
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading features...</p>
          </div>
        ) : sortedFeatures.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p>No features found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFeatures.map((feature) => (
              <Card
                key={feature.id}
                className={`overflow-hidden ${
                  feature.isArchived ? "opacity-70" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">
                      {feature.title}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(`/api/features/${feature.id}/download`, '_blank')}>
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {feature.isArchived ? (
                          <DropdownMenuItem onClick={() => restoreFeature(feature.id)}>
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => archiveFeature(feature.id)}>
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteFeature(feature.id)} className="text-red-500">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>
                    {new Date(feature.createdAt).toLocaleDateString()}
                    {feature.isArchived && (
                      <span className="text-orange-500 ml-2">(Archived)</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {feature.content.split("\n").slice(0, 3).join("\n")}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/feature/${feature.id}`)}
                  >
                    View
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New Feature</DialogTitle>
            <DialogDescription>
              Create a new feature with AI-generated scenarios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newFeature.title}
                onChange={(e) =>
                  setNewFeature({ ...newFeature, title: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                User Story
              </Label>
              <Textarea
                id="description"
                value={newFeature.description}
                onChange={(e) =>
                  setNewFeature({ ...newFeature, description: e.target.value })
                }
                className="col-span-3"
                placeholder="As a [role], I want [goal] so that [benefit]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scenario" className="text-right">
                Initial Scenario
              </Label>
              <Textarea
                id="scenario"
                value={newFeature.scenario}
                onChange={(e) =>
                  setNewFeature({ ...newFeature, scenario: e.target.value })
                }
                className="col-span-3"
                placeholder="Scenario: ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={generateFeature}
              disabled={
                isGenerating ||
                !newFeature.title ||
                !newFeature.description
              }
            >
              {isGenerating ? "Generating..." : "Generate Feature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Home;