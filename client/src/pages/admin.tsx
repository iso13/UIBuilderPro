
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface Feature {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  archived: boolean;
}

export default function Admin() {
  const { toast } = useToast();
  const [showArchived, setShowArchived] = useState(true);
  
  const queryClient = useQueryClient();

  const { data: features = [] } = useQuery<Feature[]>({
    queryKey: ["features"],
    queryFn: async () => {
      const response = await fetch("/api/features?includeArchived=true");
      if (!response.ok) {
        throw new Error("Failed to fetch features");
      }
      return response.json();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const response = await fetch(`/api/features/${id}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to archive feature");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Success",
        description: "Feature status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature status",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/features/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete feature");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Success",
        description: "Feature permanently deleted",
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

  const displayedFeatures = showArchived 
    ? features 
    : features.filter(feature => !feature.archived);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Portal</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={setShowArchived}
          />
          <label htmlFor="show-archived">Show Archived Features</label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedFeatures.map((feature) => (
          <Card 
            key={feature.id}
            className={feature.archived ? "border-dashed border-gray-400 opacity-70" : ""}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {feature.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(feature.createdAt).toLocaleDateString()}
                    {feature.archived && " • Archived"}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <span className="sr-only">Actions</span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {feature.archived ? (
                      <DropdownMenuItem
                        onClick={() => archiveMutation.mutate({ id: feature.id, archived: false })}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        <span>Restore</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => archiveMutation.mutate({ id: feature.id, archived: true })}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        <span>Archive</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to permanently delete this feature? This action cannot be undone.")) {
                          deleteMutation.mutate(feature.id);
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Permanently</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
