import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Feature {
  id: string;
  name: string;
  description: string;
  archived?: boolean;
}

export default function Home() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/features");
      if (response.ok) {
        const data = await response.json();
        setFeatures(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch features",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching features:", error);
      toast({
        title: "Error",
        description: "Failed to fetch features",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleArchive = async (featureId: string) => {
    try {
      const response = await fetch(`/api/features/${featureId}/archive`, {
        method: "PATCH",
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Feature archived successfully",
        });
        fetchFeatures();
      } else {
        toast({
          title: "Error",
          description: "Failed to archive feature",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error archiving feature:", error);
      toast({
        title: "Error",
        description: "Failed to archive feature",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Feature Management</h1>
      <div className="flex space-x-2">
        <Button onClick={() => navigate("/new")} className="bg-blue-600 hover:bg-blue-700">
          Generate New Feature
        </Button>
      </div>

      {loading ? (
        <div className="mt-4">Loading features...</div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.length === 0 ? (
            <div>No features available. Create a new one!</div>
          ) : (
            features.map((feature) => (
              <div
                key={feature.id}
                className={`rounded-lg border p-4 ${
                  feature.archived ? "bg-gray-100" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">
                    {feature.name}
                    {feature.archived && (
                      <span className="ml-2 text-sm text-gray-500">
                        (Archived)
                      </span>
                    )}
                  </h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/edit/${feature.id}`)}
                      >
                        Edit
                      </DropdownMenuItem>
                      {!feature.archived && (
                        <DropdownMenuItem
                          onClick={() => handleArchive(feature.id)}
                        >
                          Archive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-2">{feature.description}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}