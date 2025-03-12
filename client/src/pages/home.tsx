
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Wand2, Search, SortAsc, Edit2, Archive, RefreshCw, HelpCircle, Activity, ArrowRight, Download, Trash2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function Home() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFeatureToDelete, setSelectedFeatureToDelete] = useState<number | null>(null);

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["features", { includeDeleted: showArchived }],
    queryFn: async () => {
      const response = await fetch(`/api/features?includeDeleted=${showArchived}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });

  const { mutate: deleteFeature } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/features/${id}/delete`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to delete feature");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Feature archived",
        description: "The feature has been moved to the archive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive the feature",
        variant: "destructive",
      });
    },
  });

  const { mutate: restoreFeature } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/features/${id}/restore`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to restore feature");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Feature restored",
        description: "The feature has been restored from the archive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore the feature",
        variant: "destructive",
      });
    },
  });

  const { mutate: permanentlyDeleteFeature } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/features/${id}/permanent`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to permanently delete feature");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Feature deleted",
        description: "The feature has been permanently deleted",
      });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the feature",
        variant: "destructive",
      });
    },
  });

  const { mutate: exportMultipleFeatures, isLoading: isExporting } = useMutation({
    mutationFn: async (featureIds: number[]) => {
      const response = await fetch(`/api/features/export-multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featureIds }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to export features");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'features.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Features exported as a zip file",
      });
      setExportDialogOpen(false);
      setSelectedFeatures([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export features",
        variant: "destructive",
      });
    },
  });

  const filteredFeatures = features
    .filter((feature) => {
      return (
        feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.story.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  const handleSelectFeature = (id: number) => {
    setSelectedFeatures((prev) => {
      if (prev.includes(id)) {
        return prev.filter((featureId) => featureId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleExport = () => {
    if (selectedFeatures.length === 0) {
      toast({
        title: "No features selected",
        description: "Please select at least one feature to export",
        variant: "destructive",
      });
      return;
    }
    
    exportMultipleFeatures(selectedFeatures);
  };

  const handleNewFeature = () => {
    navigate("/new");
  };

  const handleArchiveFeature = (id: number) => {
    deleteFeature(id);
  };

  const handleRestoreFeature = (id: number) => {
    restoreFeature(id);
  };

  const openDeleteDialog = (id: number) => {
    setSelectedFeatureToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedFeatureToDelete) {
      permanentlyDeleteFeature(selectedFeatureToDelete);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Generated Features</h1>
      <p className="text-muted-foreground mb-6">{features.length} features found</p>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search features..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "date" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("date")}
            className="flex items-center gap-1"
          >
            <SortAsc className="h-4 w-4" />
            Date
          </Button>
          <Button
            variant={sortBy === "title" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("title")}
            className="flex items-center gap-1"
          >
            <SortAsc className="h-4 w-4 rotate-90" />
            Title
          </Button>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-archived"
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(checked === true)}
            />
            <label htmlFor="show-archived" className="text-sm cursor-pointer">
              Show Archived
            </label>
          </div>
        </div>
      </div>

      {selectedFeatures.length > 0 && (
        <div className="flex justify-between items-center p-2 bg-muted rounded mb-4">
          <span>{selectedFeatures.length} features selected</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export Selected
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={() => setSelectedFeatures([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFeatures.map((feature) => (
          <div
            key={feature.id}
            className={`border rounded-lg p-4 transition-all ${
              feature.deleted
                ? "bg-muted/50 border-dashed"
                : "hover:shadow-md"
            } ${
              selectedFeatures.includes(feature.id)
                ? "ring-2 ring-primary"
                : ""
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedFeatures.includes(feature.id)}
                  onCheckedChange={() => handleSelectFeature(feature.id)}
                  aria-label={`Select ${feature.title}`}
                />
                <h3 className="font-medium truncate max-w-[180px]" title={feature.title}>
                  {feature.title}
                </h3>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/features/${feature.id}`)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/features/${feature.id}/analyze`)}>
                    <Activity className="mr-2 h-4 w-4" />
                    Analyze
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.location.href = `/api/features/export/${feature.id}`}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </DropdownMenuItem>
                  {feature.deleted ? (
                    <>
                      <DropdownMenuItem onClick={() => handleRestoreFeature(feature.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restore
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-500 focus:text-red-500"
                        onClick={() => openDeleteDialog(feature.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Permanently
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => handleArchiveFeature(feature.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {feature.story}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {new Date(feature.createdAt).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/features/${feature.id}`)}
                className="flex items-center gap-1 text-sm"
              >
                View <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredFeatures.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No features found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Try adjusting your search or filters"
              : "Get started by creating a new feature"}
          </p>
          <Button onClick={handleNewFeature} className="flex items-center mx-auto gap-2">
            <Wand2 className="h-4 w-4" />
            Generate New Feature
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Features</DialogTitle>
            <DialogDescription>
              You are about to export {selectedFeatures.length} features as a zip file.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Delete Feature</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The feature will be permanently deleted from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-8 right-8">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="lg" 
                onClick={handleNewFeature}
                className="rounded-full h-14 w-14 shadow-lg"
              >
                <Wand2 className="h-6 w-6" />
                <span className="sr-only">Generate New Feature</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate New Feature</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default Home;
