import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Wand2, Search, SortAsc, Edit2, Archive, RefreshCw, HelpCircle, Activity, ArrowRight, Download, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";


interface Feature {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  archived: boolean;
}

interface User {
  isAdmin: boolean;
}

function Home() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByDate, setSortByDate] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { data: features = [] } = useQuery<Feature[]>({
    queryKey: ["features"],
    queryFn: async () => {
      const response = await fetch("/api/features");
      if (!response.ok) {
        throw new Error("Failed to fetch features");
      }
      return response.json();
    },
  });

  const { data: user } = useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const response = await fetch(`/api/features/${id}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive feature");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Success",
        description: "Feature status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature status",
        variant: "destructive",
      });
    },
  });

  const filteredFeatures = features
    .filter(
      (feature) =>
        (showArchived || !feature.archived) &&
        feature.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortByDate) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    title: "",
    description: "",
    scenario: "",
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

  const [isGenerating, setIsGenerating] = useState(false);

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


  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Generated Features</h1>
        <div className="flex space-x-2">
          {user?.isAdmin && (
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin")}
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin Portal
            </Button>
          )}
          <Button onClick={() => setIsFeatureDialogOpen(true)}>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate New Feature
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search features..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortByDate(!sortByDate)}
          >
            <SortAsc className="mr-2 h-4 w-4" />
            Sort by {sortByDate ? "Date" : "Name"}
          </Button>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-archived" 
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(checked === true)}
            />
            <label htmlFor="show-archived" className="text-sm">
              Show Archived
            </label>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        {filteredFeatures.length} features found
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredFeatures.map((feature) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={feature.archived ? "border-dashed border-gray-400 opacity-70" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <span className="sr-only">Actions</span>
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                          >
                            <path
                              d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                              fill="currentColor"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/feature/${feature.id}`)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        {feature.archived ? (
                          <DropdownMenuItem
                            onClick={() => archiveMutation.mutate({ id: feature.id, archived: false })}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span>Restore</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => archiveMutation.mutate({ id: feature.id, archived: true })}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            <span>Archive</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {feature.prompt}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(feature.createdAt).toLocaleDateString()}
                    {feature.archived && " • Archived"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/feature/${feature.id}`)}
                  >
                    Details
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
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