
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Wand2, Search, SortAsc, Edit2, Archive, RefreshCw, HelpCircle, Activity, ArrowRight, Download, Trash2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // API data fetching
  const { data: features = [], isLoading } = useQuery({
    queryKey: ["features"],
    queryFn: async () => {
      const response = await fetch("/api/features");
      if (!response.ok) throw new Error("Failed to fetch features");
      return response.json();
    }
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/features/${id}/archive`, {
        method: "PUT"
      });
      if (!response.ok) throw new Error("Failed to archive");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Feature archived",
        description: "The feature has been archived successfully."
      });
    }
  });

  // Delete mutation for admin users
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/features/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Feature deleted",
        description: "The feature has been permanently deleted."
      });
    }
  });

  // Handle actions
  const handleArchive = (id: string) => {
    archiveMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this feature?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generated Features</h1>
        <p className="text-muted-foreground">{features.length} features found</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {features.map((feature: any) => (
          <Card key={feature.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-semibold truncate">{feature.title}</h2>
                <div className="flex">
                  {user?.role === "ADMIN" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(feature.id)}
                      title="Delete feature"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleArchive(feature.id)}
                    title="Archive feature"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Export feature functionality
                      const dataStr = JSON.stringify(feature, null, 2);
                      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
                      const exportFileDefaultName = `${feature.title.replace(/\s+/g, '-')}.json`;
                      
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}
                    title="Export feature"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground truncate mb-4">{feature.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(feature.createdAt).toLocaleDateString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/features/${feature.id}`)}
                  className="text-xs"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Home;
