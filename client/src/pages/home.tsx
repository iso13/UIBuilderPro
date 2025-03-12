
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, SortAsc, MoreVertical, Archive, RefreshCw, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [navigate, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showArchived, setShowArchived] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get user role
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.role) {
          setUserRole(data.role);
        }
      })
      .catch((error) => console.error("Error fetching user role:", error));
  }, []);

  // Fetch features
  const { data: features = [], isLoading, error } = useQuery({
    queryKey: ["features", showArchived],
    queryFn: async () => {
      const res = await fetch(`/api/features?includeDeleted=${showArchived}`);
      if (!res.ok) throw new Error("Failed to fetch features");
      return res.json();
    },
  });

  // Archive/restore mutation
  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: number; archived: boolean }) => {
      const endpoint = archived ? `/api/features/${id}/restore` : `/api/features/${id}/delete`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Failed to ${archived ? "restore" : "archive"} feature`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Success",
        description: "Feature status updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Permanent delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/features/${id}/permanent`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete feature permanently");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Success",
        description: "Feature permanently deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/features/export?showArchived=${showArchived}`);
      if (!res.ok) throw new Error("Failed to export features");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "features.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Features exported",
        description: "All features have been exported as a zip file",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter and sort features
  const filteredFeatures = features
    .filter((feature: any) => {
      return (
        feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.story.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a: any, b: any) => {
      if (sortOrder === "asc") {
        return a.title.localeCompare(b.title);
      }
      return b.title.localeCompare(a.title);
    });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Feature Management</h1>
        <div className="flex space-x-2">
          <Button onClick={() => navigate("/new")} className="bg-blue-600 hover:bg-blue-700">
            Generate New Feature
          </Button>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-1">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search Features</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title or description..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div>
            <Label htmlFor="sort">Sort Order</Label>
            <Button
              id="sort"
              variant="outline"
              className="flex w-full items-center justify-between"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <span>Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
              <SortAsc className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
            </Button>
          </div>
          <div>
            <Label htmlFor="archived">Show Archived</Label>
            <Button
              id="archived"
              variant="outline"
              className={`flex w-full items-center justify-between ${
                showArchived ? "border-blue-500 text-blue-500" : ""
              }`}
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? "Showing All" : "Active Only"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">Loading features...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">Error loading features</div>
        ) : filteredFeatures.length === 0 ? (
          <div className="text-center py-8">No features found</div>
        ) : (
          filteredFeatures.map((feature: any) => (
            <div
              key={feature.id}
              className={`rounded-lg border p-4 ${
                feature.archived ? "bg-gray-50 border-gray-200" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-lg font-semibold ${feature.archived ? "text-gray-500" : ""}`}>
                    {feature.title}
                    {feature.archived && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                        Archived
                      </span>
                    )}
                  </h3>
                  <p className={`mt-1 text-sm ${feature.archived ? "text-gray-500" : "text-gray-600"}`}>
                    {feature.story}
                  </p>
                  <div className="mt-2 text-xs text-gray-400">
                    {feature.scenarioCount} scenarios • Last updated:{" "}
                    {new Date(feature.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    onClick={() => navigate(`/features/${feature.id}`)}
                    variant="ghost"
                    size="sm"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => archiveMutation.mutate({ id: feature.id, archived: !feature.archived })}
                    variant="ghost"
                    size="sm"
                    title={feature.archived ? "Restore" : "Archive"}
                  >
                    {feature.archived ? <RefreshCw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                  {userRole === "admin" && (
                    <Button
                      onClick={() => {
                        if (confirm("Are you sure you want to permanently delete this feature? This action cannot be undone.")) {
                          deleteMutation.mutate(feature.id);
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
