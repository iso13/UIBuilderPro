
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Feature } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"active" | "deleted" | "all">("active");
  
  const { data: features, isLoading } = useQuery<Feature[]>({
    queryKey: [`/api/features?filter=${filter}`],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredFeatures = features || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Feature Management</h1>
      <div className="flex space-x-2">
        <Button 
          onClick={() => navigate("/new")} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          Generate New Feature
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature) => (
          <Card key={feature.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="truncate">{feature.title}</CardTitle>
              <CardDescription>
                Created: {new Date(feature.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3">{feature.story}</p>
            </CardContent>
            <CardFooter className="bg-muted/50 flex justify-between">
              <div>
                <span className="text-sm">{feature.scenarios.length} scenarios</span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/view/${feature.id}`)}
                >
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/edit/${feature.id}`)}
                >
                  Edit
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="text-center mt-12">
          <h3 className="text-lg font-medium">No features found</h3>
          <p className="text-muted-foreground mt-1">
            Generate your first feature by clicking the button above.
          </p>
        </div>
      )}
    </div>
  );
}
