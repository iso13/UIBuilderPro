import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, SortAsc, MoreVertical, Archive, Download, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";


// Placeholder for toast if not available
const useToast = () => {
  return {
    toast: (params: any) => console.log("Toast:", params)
  };
};

function Home() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");
  const [showArchived, setShowArchived] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");

  // Fetch user data to determine role
  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch user data");
      return res.json();
    }
  });

  useEffect(() => {
    if (userData) {
      setUserRole(userData.isAdmin ? "admin" : "user");
    }
  }, [userData]);

  // Fetch features data
  const { data: features = [] } = useQuery({
    queryKey: ["features", showArchived],
    queryFn: async () => {
      const res = await fetch(`/api/features?archived=${showArchived}`);
      if (!res.ok) throw new Error("Failed to fetch features");
      return res.json();
    }
  });

  // Archive/restore mutation
  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: number; archived: boolean }) => {
      const res = await fetch(`/api/features/${id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived })
      });
      if (!res.ok) throw new Error("Failed to update feature");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Feature updated",
        description: "The feature has been updated successfully",
      });
    }
  });

  // Delete mutation (for admin)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/features/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete feature");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      toast({
        title: "Feature deleted",
        description: "The feature has been permanently deleted",
      });
    }
  });

  // Export features
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
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export features",
        variant: "destructive",
      });
    }
  };

  // Sort features
  const sortedFeatures = [...features].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "a-z") return a.title.localeCompare(b.title);
    if (sortBy === "z-a") return b.title.localeCompare(a.title);
    return 0;
  });

  // Filter features by search term
  const filteredFeatures = sortedFeatures.filter(feature =>
    feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.story.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search features..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort" className="whitespace-nowrap">Sort by:</Label>
          <select
            id="sort"
            className="border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="a-z">A-Z</option>
            <option value="z-a">Z-A</option>
          </select>
          <Label className="flex items-center gap-1 ml-4">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Show Archived
          </Label>
        </div>
      </div>

      <div className="space-y-4">
        {filteredFeatures.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No features found</div>
        ) : (
          filteredFeatures.map((feature) => (
            <div
              key={feature.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-all ${feature.archived ? 'bg-gray-100 border-gray-300' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {feature.title}
                    {feature.archived && (
                      <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                        Archived
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-600 my-2">{feature.story}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {feature.tags?.split(',').map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    onClick={() => navigate(`/view/${feature.id}`)}
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

export default Home;