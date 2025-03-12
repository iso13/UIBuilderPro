import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Feature } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: features = [], isLoading, error } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/features/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature deleted",
        description: "The feature has been moved to trash",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/features/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature restored",
        description: "The feature has been restored",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore feature",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Failed to load features
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Features</h1>
        <Button onClick={() => navigate("/new")}>Generate New Feature</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!features || features.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No features found. Create your first feature!</p>
          </div>
        ) : (
          features.map((feature) => (
            <Card key={feature.id} className={feature.deleted ? "opacity-60" : ""}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{feature.title}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (feature.deleted) {
                        restoreMutation.mutate(feature.id);
                      } else {
                        deleteMutation.mutate(feature.id);
                      }
                    }}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-gray-600 mb-4">{feature.story}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Created: {new Date(feature.createdAt).toLocaleDateString()}
                  </span>
                  {feature.deleted && (
                    <span className="text-sm text-red-500">Deleted</span>
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