
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

  const { data: features = [], refetch } = useQuery({
    queryKey: [`/api/features${showDeleted ? '?includeDeleted=true' : ''}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/features${showDeleted ? '?includeDeleted=true' : ''}`);
        if (!res.ok) throw new Error("Failed to fetch features");
        return await res.json();
      } catch (err) {
        console.error("Error fetching features:", err);
        return [];
      }
    }
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
      const res = await apiRequest("POST", "/api/features/export", { featureIds: selectedFeatures });
      if (!res.ok) throw new Error("Failed to export features");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `features-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Selected features have been exported",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleGenerateNew = () => {
    navigate("/new");
  };

  const toggleFeatureSelection = (id: number) => {
    setSelectedFeatures(prev => 
      prev.includes(id) 
        ? prev.filter(fId => fId !== id) 
        : [...prev, id]
    );
  };

  const handleFeatureAction = async (id: number, action: 'delete' | 'restore' | 'edit' | 'export') => {
    try {
      if (action === 'delete' || action === 'restore') {
        const res = await apiRequest("PATCH", `/api/features/${id}`, { 
          deleted: action === 'delete' 
        });
        
        if (!res.ok) throw new Error(`Failed to ${action} feature`);
        
        toast({
          title: `Feature ${action === 'delete' ? 'deleted' : 'restored'}`,
          description: `The feature has been ${action === 'delete' ? 'deleted' : 'restored'} successfully`,
        });
        
        refetch();
      } else if (action === 'edit') {
        navigate(`/edit/${id}`);
      } else if (action === 'export') {
        const res = await apiRequest("GET", `/api/features/${id}/export`);
        if (!res.ok) throw new Error("Failed to export feature");
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feature-${id}-export.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export successful",
          description: "Feature has been exported",
        });
      }
    } catch (error) {
      toast({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} failed`,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Feature Management</h1>
      <div className="flex space-x-2">
        <Button onClick={handleGenerateNew} className="bg-blue-600 hover:bg-blue-700">
          Generate New Feature
        </Button>
        <Button 
          onClick={handleExportMultiple} 
          variant="outline" 
          className={selectedFeatures.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
          disabled={selectedFeatures.length === 0}
        >
          Export Selected
        </Button>
        <Button onClick={() => setShowDeleted(!showDeleted)} variant="outline">
          {showDeleted ? "Hide Deleted" : "Show Deleted"}
        </Button>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.length > 0 ? (
          features.map((feature: any) => (
            <div 
              key={feature.id} 
              className={`border rounded-lg p-4 relative transition-all ${
                feature.deleted ? "opacity-60 bg-gray-100" : ""
              }`}
            >
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!feature.deleted && (
                      <>
                        <DropdownMenuItem onClick={() => handleFeatureAction(feature.id, 'edit')}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFeatureAction(feature.id, 'export')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFeatureAction(feature.id, 'delete')}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    {feature.deleted && (
                      <DropdownMenuItem onClick={() => handleFeatureAction(feature.id, 'restore')}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restore
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="mb-2">
                <Checkbox 
                  id={`select-${feature.id}`}
                  checked={selectedFeatures.includes(feature.id)}
                  onCheckedChange={() => toggleFeatureSelection(feature.id)}
                />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{feature.name}</h3>
              <p className="text-gray-600 mb-2">{feature.description}</p>
              <div className="text-sm text-gray-500">
                Created: {new Date(feature.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-gray-500">
            No features found. Click "Generate New Feature" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
