
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical as MoreVerticalIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState("active");

  const { data: features = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/features", filter],
    queryFn: getQueryFn(),
  });

  const handleDeleteFeature = async (id) => {
    try {
      await apiRequest("DELETE", `/api/features/${id}`);
      toast({
        title: "Feature deleted",
        description: "The feature has been moved to trash",
      });
      refetch();
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
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore feature",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return <div>Error loading features: {error.message}</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold">Feature Management</h1>
      <div className="flex space-x-2">
        <Button
          onClick={() => navigate("/new")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Generate New Feature
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p>Loading features...</p>
        ) : features.length === 0 ? (
          <p>No features found. Create a new one!</p>
        ) : (
          features.map((feature) => (
            <Card key={feature.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{feature.title}</h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/edit/${feature.id}`)}>
                        Edit
                      </DropdownMenuItem>
                      {!feature.deleted ? (
                        <DropdownMenuItem onClick={() => handleDeleteFeature(feature.id)}>
                          Delete
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleRestoreFeature(feature.id)}>
                          Restore
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Created: {formatDate(feature.createdAt)}
                </p>
                <p className="mt-2 line-clamp-3">{feature.story}</p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/view/${feature.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
