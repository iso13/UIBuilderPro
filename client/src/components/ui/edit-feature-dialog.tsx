import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Feature } from "@shared/schema";

interface EditFeatureDialogProps {
  feature: Feature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditFeatureDialog({ feature, open, onOpenChange }: EditFeatureDialogProps) {
  const [title, setTitle] = useState(feature?.title || "");
  const [story, setStory] = useState(feature?.story || "");
  const [generatedContent, setGeneratedContent] = useState(feature?.generatedContent || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when dialog opens with new feature
  useEffect(() => {
    if (feature) {
      setTitle(feature.title);
      setStory(feature.story);
      setGeneratedContent(feature.generatedContent || "");
    }
  }, [feature]);

  const updateFeatureMutation = useMutation({
    mutationFn: async () => {
      if (!feature) return;
      if (!title.trim()) throw new Error("Feature title is required");
      if (!story.trim()) throw new Error("Feature story is required");

      return apiRequest("PUT", `/api/features/${feature.id}`, {
        title,
        story,
        generatedContent,
        manuallyEdited: true
      });
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Feature updated successfully",
      });
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ["/api/features"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update feature",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFeatureMutation.mutateAsync();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px] bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Feature</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Feature Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter feature title"
              className="bg-background focus:ring-0 border-gray-800"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="story" className="text-sm font-medium">User Story</Label>
            <Textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Enter user story"
              className="bg-background focus:ring-0 border-gray-800 min-h-[100px]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="generatedContent" className="text-sm font-medium">Feature Content</Label>
            <Textarea
              id="generatedContent"
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              placeholder="Enter feature content"
              className="bg-background focus:ring-0 border-gray-800 min-h-[300px] font-mono"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateFeatureMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}