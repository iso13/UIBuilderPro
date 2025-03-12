
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, MoreVertical, Archive, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Home() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [showArchived, setShowArchived] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
  }, []);

  const { data: features = [], refetch, isLoading } = useQuery({
    queryKey: ["features"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/features");
      if (!res.ok) {
        throw new Error("Failed to fetch features");
      }
      return res.json();
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const res = await apiRequest("DELETE", `/api/features/${id}`);
      if (res.ok) {
        toast({
          title: "Feature deleted",
          description: "The feature has been permanently deleted.",
        });
        refetch();
      } else {
        throw new Error("Failed to delete feature");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      });
    }
    setConfirmDelete(null);
  };

  const handleArchive = async (id: string, archived: boolean) => {
    try {
      const res = await apiRequest("PATCH", `/api/features/${id}`, {
        archived,
      });
      if (res.ok) {
        toast({
          title: archived ? "Feature archived" : "Feature restored",
          description: archived
            ? "The feature has been archived and is now hidden from the main view."
            : "The feature has been restored and is now visible in the main view.",
        });
        refetch();
      } else {
        throw new Error(archived ? "Failed to archive feature" : "Failed to restore feature");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: archived ? "Failed to archive feature" : "Failed to restore feature",
        variant: "destructive",
      });
    }
    setConfirmArchive(null);
    setConfirmRestore(null);
  };

  const visibleFeatures = showArchived
    ? features
    : features.filter((feature: any) => !feature.archived);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feature Management</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
          <Button onClick={() => navigate("/new")} className="bg-blue-600 hover:bg-blue-700">
            Generate New Feature
          </Button>
          {userRole === "admin" && (
            <Button onClick={() => navigate("/admin")} variant="outline">
              Admin Dashboard
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      ) : visibleFeatures.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">No features found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {showArchived
              ? "There are no archived features. Features that are archived will appear here."
              : "Start by generating a new feature to organize your test scenarios."}
          </p>
          {!showArchived && (
            <Button onClick={() => navigate("/new")}>
              Generate New Feature
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleFeatures.map((feature: any) => (
            <Card
              key={feature.id}
              className={`${
                feature.archived ? "opacity-75 border-dashed" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle
                      className="cursor-pointer hover:underline"
                      onClick={() => navigate(`/feature/${feature.id}`)}
                    >
                      {feature.title}
                    </CardTitle>
                    <CardDescription>
                      {new Date(feature.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/feature/${feature.id}`)}
                      >
                        Open Feature
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(`/feature/${feature.id}/edit`)}
                      >
                        Edit Feature
                      </DropdownMenuItem>
                      {!feature.archived ? (
                        <DropdownMenuItem
                          onClick={() => setConfirmArchive(feature.id)}
                          className="text-amber-600 dark:text-amber-400"
                        >
                          Archive Feature
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setConfirmRestore(feature.id)}
                          className="text-green-600 dark:text-green-400"
                        >
                          Restore Feature
                        </DropdownMenuItem>
                      )}
                      {userRole === "admin" && (
                        <DropdownMenuItem
                          onClick={() => setConfirmDelete(feature.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          Delete Feature
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {feature.archived && (
                  <Badge
                    variant="outline"
                    className="text-amber-600 dark:text-amber-400 mt-2"
                  >
                    Archived
                  </Badge>
                )}
              </CardHeader>
              <CardContent
                className="cursor-pointer"
                onClick={() => navigate(`/feature/${feature.id}`)}
              >
                <p className="line-clamp-3 text-sm text-gray-500 dark:text-gray-400">
                  {feature.content}
                </p>
              </CardContent>
              <CardFooter className="pt-1">
                <div className="flex gap-1 flex-wrap">
                  {feature.tags &&
                    feature.tags.split(",").map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="mr-1 mb-1">
                        {tag.trim()}
                      </Badge>
                    ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              feature and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmArchive} onOpenChange={() => setConfirmArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this feature?</AlertDialogTitle>
            <AlertDialogDescription>
              This feature will be archived and hidden from the main view. You can
              restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmArchive && handleArchive(confirmArchive, true)}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmRestore} onOpenChange={() => setConfirmRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this feature?</AlertDialogTitle>
            <AlertDialogDescription>
              This feature will be restored and visible in the main view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRestore && handleArchive(confirmRestore, false)}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
