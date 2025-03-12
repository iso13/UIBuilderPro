import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { MoreVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [, navigate] = useLocation();
  const { data: features = [], error, refetch } = useQuery({
    queryKey: ["/api/features"],
  });

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
      <div className="flex space-x-2 my-4">
        <Button
          onClick={() => navigate("/new")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Generate New Feature
        </Button>
      </div>

      {features.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No features found. Create your first feature!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {features.map((feature) => (
            <Card key={feature.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold mb-2">{feature.name}</h2>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/edit/${feature.id}`)}>
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3">{feature.description}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Created: {formatDate(feature.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}