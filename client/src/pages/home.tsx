
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchFeatures = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("GET", "/api/features");
      setFeatures(data);
      setError(null);
    } catch (err) {
      setError("Failed to load features");
      console.error("Error fetching features:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleDeleteFeature = async (id) => {
    try {
      await apiRequest("DELETE", `/api/features/${id}`);
      toast({
        title: "Feature deleted",
        description: "The feature has been moved to trash",
      });
      fetchFeatures();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      });
    }
  };

  const handleRestoreFeature = async (id) => {
    try {
      await apiRequest("PATCH", `/api/features/${id}/restore`);
      toast({
        title: "Feature restored",
        description: "The feature has been restored",
      });
      fetchFeatures();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore feature",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Features</h1>
        <Button onClick={() => navigate("/new")}>Generate New Feature</Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No features found. Create your first feature!</p>
          </div>
        ) : (
          features.map((feature) => (
            <Card key={feature.id} className={feature.deletedAt ? "opacity-60" : ""}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{feature.name}</h2>
                  <div className="relative">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden">
                      <div className="py-1">
                        <button
                          onClick={() => navigate(`/edit/${feature.id}`)}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        {feature.deletedAt ? (
                          <button
                            onClick={() => handleRestoreFeature(feature.id)}
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteFeature(feature.id)}
                            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Created: {new Date(feature.createdAt).toLocaleDateString()}
                  </span>
                  {feature.deletedAt && (
                    <span className="text-sm text-red-500">
                      Deleted: {new Date(feature.deletedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default Home;
