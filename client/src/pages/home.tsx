
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Wand2, Search, SortAsc, Edit2, Archive, RefreshCw, 
  HelpCircle, Activity, ArrowRight, Download, Trash2, MoreVertical 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortBy, setSortBy] = useState<"title" | "date">("date");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);

  // Fetch features with includeDeleted parameter
  const { data: features = [], isLoading } = useQuery({
    queryKey: ["/api/features", showDeleted],
    queryFn: async () => {
      const response = await fetch(`/api/features?includeDeleted=${showDeleted}`);
      if (!response.ok) throw new Error("Failed to fetch features");
      return response.json();
    },
  });

  // Delete feature mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/features/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete feature");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature deleted",
        description: "The feature has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Archive feature mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/features/${id}/delete`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to archive feature");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature archived",
        description: "The feature has been successfully archived.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Restore feature mutation
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/features/${id}/restore`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to restore feature");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature restored",
        description: "The feature has been successfully restored.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export multiple features mutation
  const exportMultipleMutation = useMutation({
    mutationFn: async (featureIds: number[]) => {
      const response = await fetch(`/api/features/export-multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featureIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to export features");
      }
      
      // Create a blob from the response and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "features.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Features exported",
        description: "Selected features have been downloaded as a ZIP file.",
      });
      setSelectedFeatureIds([]); // Clear selection
    },
    onError: (error: Error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and sort features
  const filteredFeatures = features
    .filter((feature: any) => 
      feature.title.toLowerCase().includes(search.toLowerCase()) ||
      feature.story.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Handle actions
  const handleArchive = (id: string) => {
    archiveMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this feature?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle feature selection
  const toggleFeatureSelection = (id: number) => {
    setSelectedFeatureIds(prevIds => 
      prevIds.includes(id) 
        ? prevIds.filter(featureId => featureId !== id) 
        : [...prevIds, id]
    );
  };

  const exportSelectedFeatures = () => {
    if (selectedFeatureIds.length > 0) {
      exportMultipleMutation.mutate(selectedFeatureIds);
    } else {
      toast({
        title: "No features selected",
        description: "Please select at least one feature to export.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generated Features</h1>
        <p className="text-muted-foreground">{features.length} features found</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button 
            variant={sortBy === "date" ? "default" : "outline"} 
            className="flex items-center gap-2"
            onClick={() => setSortBy("date")}
          >
            <SortAsc className="h-4 w-4" />
            Date
          </Button>
          
          <Button 
            variant={sortBy === "title" ? "default" : "outline"} 
            className="flex items-center gap-2"
            onClick={() => setSortBy("title")}
          >
            <SortAsc className="h-4 w-4" />
            Title
          </Button>
          
          <Button 
            variant={showDeleted ? "default" : "outline"} 
            className="flex items-center gap-2"
            onClick={() => setShowDeleted(!showDeleted)}
          >
            <Archive className="h-4 w-4" />
            {showDeleted ? "Showing Archived" : "Show Archived"}
          </Button>
        </div>

        <div className="flex flex-row gap-4">
          {selectedFeatureIds.length > 0 && (
            <Button
              onClick={exportSelectedFeatures}
              className="flex items-center gap-2"
              disabled={exportMultipleMutation.isPending}
            >
              <Download className="h-4 w-4" />
              Export {selectedFeatureIds.length} Selected
            </Button>
          )}
          
          <Button
            onClick={() => navigate("/generate")}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Generate New Feature
          </Button>
        </div>
      </div>

      {filteredFeatures.length === 0 ? (
        <div className="p-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No features found</h3>
          <p className="text-muted-foreground">
            {search ? "Try a different search term" : "Generate your first feature to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredFeatures.map((feature: any) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`border rounded-lg p-6 flex flex-col ${
                  feature.deleted ? "bg-muted/50" : ""
                } ${
                  selectedFeatureIds.includes(feature.id) ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold truncate flex-1">{feature.title}</h3>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFeatureIds.includes(feature.id)}
                      onChange={() => toggleFeatureSelection(feature.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/features/${feature.id}`)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => navigate(`/features/${feature.id}/analyze`)}
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          Analyze
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => window.open(`/api/features/export/${feature.id}`, '_blank')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuItem>
                        
                        {feature.deleted ? (
                          <DropdownMenuItem
                            onClick={() => restoreMutation.mutate(feature.id.toString())}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleArchive(feature.id.toString())}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        
                        {user?.isAdmin && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(feature.id.toString())}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-3">
                  {feature.story}
                </p>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{new Date(feature.createdAt).toLocaleDateString()}</span>
                    {feature.deleted && (
                      <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
                        Archived
                      </span>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/features/${feature.id}`)}
                    className="flex items-center gap-1"
                  >
                    View
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default Home;
