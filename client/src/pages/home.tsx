import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { type Feature, FeatureFilter } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FeatureFilter>("active");

  const { data: features = [], refetch } = useQuery<Feature[]>({
    queryKey: [`/api/features?filter=${filter}`],
  });

  // Function to truncate text to a specific length
  const truncateText = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="container py-8 mx-auto">
      <h1 className="text-2xl font-bold">Feature Management</h1>
      <div className="flex space-x-2">
        <Button onClick={() => navigate("/new")} className="bg-blue-600 hover:bg-blue-700">
          Generate New Feature
        </Button>
      </div>

      <Tabs defaultValue="active" className="mt-6" onValueChange={(value) => setFilter(value as FeatureFilter)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deleted">Trash</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          {features.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card 
                  key={feature.id} 
                  className={`overflow-hidden ${feature.deleted ? "opacity-60" : ""}`}
                >
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{feature.title}</h3>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Created: {new Date(feature.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-3">{truncateText(feature.story)}</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/edit/${feature.id}`)}
                      disabled={feature.deleted}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">
                {filter === "active" 
                  ? "No active features found. Click 'Generate New Feature' to create one."
                  : filter === "deleted" 
                    ? "No deleted features found." 
                    : "No features found."
                }
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}