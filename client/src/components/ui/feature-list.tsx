import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feature } from "@/types/features";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "./badge";

export function FeatureList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["/api/features"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/features");
      return data;
    },
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
  });

  const copyFeature = async (feature: Feature) => {
    try {
      await apiRequest("POST", "/api/features/copy", { id: feature.id });
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      toast({
        title: "Feature copied",
        description: "A copy of the feature has been created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy feature",
        variant: "destructive",
      });
    }
  };

  const editFeature = (feature: Feature) => {
    navigate(`/edit/${feature.id}`);
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {isLoading ? (
        <p>Loading features...</p>
      ) : features.length === 0 ? (
        <p>No features found.</p>
      ) : (
        features.map((feature) => (
          <Card
            key={feature.id}
            className="overflow-hidden border border-white/10 bg-zinc-800 backdrop-blur"
          >
            <CardContent className="p-4">
              <div className="flex flex-col h-full">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg leading-none tracking-tight text-white">
                      {feature.title}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/10"
                        onClick={() => copyFeature(feature)}
                        title="Copy feature"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/10"
                        onClick={() => editFeature(feature)}
                        title="Edit feature"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/10 text-red-500 hover:text-red-400"
                        onClick={() => deleteMutation.mutate(feature.id)}
                        title="Delete feature"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant="outline" className="px-1.5 text-xs">
                    {feature.scenarioCount} scenarios
                  </Badge>
                  <p className="text-sm text-gray-400 mt-2">{feature.story}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}