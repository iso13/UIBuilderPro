import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";

export default function Home() {
  const [, navigate] = useLocation();
  const [features, setFeatures] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  async function refetch() {
    try {
      setIsLoading(true);
      const data = await apiRequest("GET", "/api/features");
      setFeatures(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching features:", error);
      toast({
        title: "Error fetching features",
      });
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refetch();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const userData = await apiRequest("GET", "/api/me");
      setIsAdmin(userData.role === "ADMIN");
      setIsLoadingAdmin(false);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setIsLoadingAdmin(false);
    }
  };

  const handleArchiveFeature = async (id) => {
    try {
      await apiRequest("PATCH", `/api/features/${id}/archive`);
      toast({
        title: "Feature archived",
        description: "The feature has been archived",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive feature",
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
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore feature",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Feature Request Board</h1>
        <div className="flex gap-2">
          {!isLoadingAdmin && isAdmin && (
            <Button onClick={() => navigate("/admin")} variant="outline">
              Admin Dashboard
            </Button>
          )}
          <Button onClick={() => navigate("/new")}>Generate New Feature</Button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading features...</p>
      ) : features.length === 0 ? (
        <p>No features yet. Create one by clicking "Generate New Feature".</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card key={feature.id} className="relative">
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/edit/${feature.id}`)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Status: {feature.status}
                  </span>
                  {feature.status !== "ARCHIVED" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleArchiveFeature(feature.id)}
                    >
                      Archive
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreFeature(feature.id)}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}