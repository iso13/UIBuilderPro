
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Download,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const { data: features = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/features${showDeleted ? '?includeDeleted=true' : ''}`],
  });

  const handleExportMultiple = async () => {
    if (selectedFeatures.length === 0) {
      toast({
        title: "No features selected",
        description: "Please select at least one feature to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/features/export-multiple", {
        featureIds: selectedFeatures,
      });
      
      // Create a blob from the response data
      const blob = new Blob([JSON.stringify(response, null, 2)], {
        type: "application/json",
      });
      
      // Create a download link and trigger the download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "features.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Features exported",
        description: `Successfully exported ${selectedFeatures.length} features`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the features",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFeature = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/features/${id}`);
      refetch();
      toast({
        title: "Feature deleted",
        description: "The feature was successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the feature",
        variant: "destructive",
      });
    }
  };

  const handleRestoreFeature = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/features/${id}/restore`);
      refetch();
      toast({
        title: "Feature restored",
        description: "The feature was successfully restored",
      });
    } catch (error) {
      toast({
        title: "Restore failed",
        description: "There was an error restoring the feature",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold">Feature Management</h1>
      <div className="flex space-x-2">
        <Button onClick={() => navigate("/new")} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Generate New Feature
        </Button>
        
        <Button onClick={handleExportMultiple} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export Selected
        </Button>
        
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
        
        <div className="flex items-center space-x-2 ml-auto">
          <Checkbox 
            id="showDeleted" 
            checked={showDeleted} 
            onCheckedChange={(checked) => setShowDeleted(checked === true)}
          />
          <label htmlFor="showDeleted" className="text-sm">Show deleted</label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {features.map((feature: any) => (
          <div 
            key={feature.id} 
            className={`border rounded-lg p-4 ${feature.isDeleted ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  checked={selectedFeatures.includes(feature.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFeatures([...selectedFeatures, feature.id]);
                    } else {
                      setSelectedFeatures(selectedFeatures.filter(id => id !== feature.id));
                    }
                  }}
                  disabled={feature.isDeleted}
                />
                <div>
                  <h3 className="font-medium">{feature.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!feature.isDeleted ? (
                    <>
                      <DropdownMenuItem onClick={() => navigate(`/edit/${feature.id}`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteFeature(feature.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => handleRestoreFeature(feature.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Restore
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
