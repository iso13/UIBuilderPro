
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MoreVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function Home() {
  const [, navigate] = useLocation();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("GET", "/api/features");
      setFeatures(data);
    } catch (error) {
      console.error("Error fetching features:", error);
      toast.error("Failed to load features");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      const data = await apiRequest("GET", "/api/users/me");
      setUserRole(data.role);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  useEffect(() => {
    fetchFeatures();
    fetchUserRole();
  }, []);

  const handleArchiveFeature = async (id) => {
    try {
      await apiRequest("PATCH", `/api/features/${id}/archive`);
      toast.success("Feature archived");
      fetchFeatures();
    } catch (error) {
      toast.error("Failed to archive feature");
    }
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Feature Ideas</h1>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/new")}>Generate New Feature</Button>
          {userRole === "ADMIN" && (
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin")}
            >
              Admin Portal
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : features.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold">No features yet</h2>
          <p className="text-muted-foreground mt-2">
            Generate your first feature to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features
            .filter(feature => !feature.archived)
            .map((feature) => (
              <Card key={feature.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-xl mb-2">{feature.name}</h3>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const dropdown = document.getElementById(`dropdown-${feature.id}`);
                            dropdown.classList.toggle("hidden");
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        <div
                          id={`dropdown-${feature.id}`}
                          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 hidden z-10"
                        >
                          <div className="py-1">
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => navigate(`/edit/${feature.id}`)}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => handleArchiveFeature(feature.id)}
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {feature.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {feature.tags?.split(",").map(
                        (tag, i) =>
                          tag && (
                            <span
                              key={i}
                              className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                            >
                              {tag.trim()}
                            </span>
                          )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

export default Home;
