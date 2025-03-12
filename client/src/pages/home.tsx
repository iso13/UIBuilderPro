
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, SortAsc, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showArchived, setShowArchived] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number } | null>(null);

  // Get all features
  const { data: features = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/features"],
    queryFn: async () => {
      const res = await fetch(`/api/features?showArchived=${showArchived}`);
      if (!res.ok) throw new Error("Failed to fetch features");
      return res.json();
    },
  });

  // Filter features based on search query
  const filteredFeatures = features.filter((feature) =>
    feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feature.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort features based on sort direction
  const sortedFeatures = [...filteredFeatures].sort((a, b) => {
    if (sortDirection === "asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Handle deleting a feature
  const handleDelete = async (id) => {
    try {
      await apiRequest("DELETE", `/api/features/${id}`);
      toast({
        title: "Feature archived",
        description: "The feature has been archived",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive feature",
        variant: "destructive",
      });
    }
  };

  // Handle restoring a feature
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

  // Handle context menu
  const handleContextMenu = (e, id) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle exporting features
  const handleExportFeatures = async () => {
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
      toast({
        title: "Error",
        description: "Failed to export features",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feature Store</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/new")} variant="default">
            Generate New Feature
          </Button>
          <Button onClick={handleExportFeatures} variant="outline">
            Export Features
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search features..."
            className="pl-8 pr-4 py-2 w-full border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="checkbox"
            />
            Show Archived
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="flex items-center gap-1"
          >
            <SortAsc size={16} />
            {sortDirection === "asc" ? "Oldest" : "Newest"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : sortedFeatures.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">No features found</p>
          <Button onClick={() => navigate("/new")} variant="link" className="mt-2">
            Generate a new feature
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFeatures.map((feature) => (
            <Card
              key={feature.id}
              className={`overflow-hidden ${feature.deletedAt ? "opacity-60" : ""}`}
            >
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold mb-2 flex-1">{feature.title}</h2>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleContextMenu(e, feature.id)}
                      >
                        <MoreVertical size={16} />
                      </Button>
                      {contextMenu && contextMenu.id === feature.id && (
                        <div
                          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border"
                          style={{
                            position: "fixed",
                            top: contextMenu.y,
                            left: contextMenu.x,
                          }}
                        >
                          {feature.deletedAt ? (
                            <button
                              onClick={() => handleRestoreFeature(feature.id)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => navigate(`/edit/${feature.id}`)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(feature.id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                              >
                                Archive
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {feature.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(feature.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
