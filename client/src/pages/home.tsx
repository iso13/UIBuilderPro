
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

  const { data: features = [], refetch } = useQuery<any[]>([
    `/api/features${showDeleted ? '?includeDeleted=true' : ''}`,
  ]);

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

      // Create a download link for the zip file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'features.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Features exported successfully",
        description: `${selectedFeatures.length} features exported as zip`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export features",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeature = (id: number) => {
    setSelectedFeatures((prev) =>
      prev.includes(id)
        ? prev.filter((featureId) => featureId !== id)
        : [...prev, id]
    );
  };

  const toggleShowDeleted = () => {
    setShowDeleted(!showDeleted);
  };

  const handleFeatureAction = async (id: number, action: 'delete' | 'restore') => {
    try {
      await apiRequest("POST", `/api/features/${id}/${action}`, {});
      refetch();
      toast({
        title: action === 'delete' ? "Feature deleted" : "Feature restored",
        description: action === 'delete' 
          ? "The feature has been moved to trash" 
          : "The feature has been restored",
      });
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold">Feature Management</h1>
      <div className="flex space-x-2">
        <Button onClick={() => navigate("/new")} className="bg-blue-600 hover:bg-blue-700">
          Generate New Feature
        </Button>
      </div>

      <div className="mt-6">
        <div className="flex justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={toggleShowDeleted}
            />
            <label htmlFor="show-deleted" className="text-sm">
              Show deleted features
            </label>
          </div>
          
          {selectedFeatures.length > 0 && (
            <Button variant="outline" onClick={handleExportMultiple}>
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`border p-4 rounded-lg ${
                feature.deleted ? "opacity-70 bg-gray-50" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-2">
                  {!feature.deleted && (
                    <Checkbox
                      checked={selectedFeatures.includes(feature.id)}
                      onCheckedChange={() => handleToggleFeature(feature.id)}
                      id={`feature-${feature.id}`}
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {feature.story}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!feature.deleted ? (
                      <>
                        <DropdownMenuItem onClick={() => navigate(`/edit/${feature.id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFeatureAction(feature.id, 'delete')}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => handleFeatureAction(feature.id, 'restore')}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restore
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
        
        {features.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {showDeleted 
                ? "No deleted features found" 
                : "No features yet. Create your first feature!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
