
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function NewFeature() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description) {
      toast({
        title: "Missing information",
        description: "Please provide a name and description for the feature",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/features", {
        name,
        description,
      });
      
      toast({
        title: "Feature created",
        description: "The feature was successfully created",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating the feature",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate New Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Feature Name</Label>
              <Input 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter feature name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this feature does"
                required
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Feature"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
