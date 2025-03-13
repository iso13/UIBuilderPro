import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewFeature() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [scenarioCount, setScenarioCount] = useState("3");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !story) {
      toast({
        title: "Missing information",
        description: "Please provide a title and story for the feature",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/features", {
        title,
        story,
        scenarioCount: parseInt(scenarioCount, 10),
      });

      toast({
        title: "Feature created",
        description: "The feature was successfully created",
      });

      navigate("/");
    } catch (error) {
      console.error("Error creating feature:", error);
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
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Generate New Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Feature Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for the feature"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="story">User Story</Label>
              <Textarea
                id="story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="As a [role], I want to [action], So that [benefit]"
                rows={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenarioCount">Number of Scenarios</Label>
              <Select
                value={scenarioCount}
                onValueChange={setScenarioCount}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select number of scenarios" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Scenario{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Feature"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}