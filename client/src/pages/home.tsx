import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { insertFeatureSchema, type InsertFeature } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [generatedFeature, setGeneratedFeature] = useState<string>("");

  const form = useForm<InsertFeature>({
    resolver: zodResolver(insertFeatureSchema),
    defaultValues: {
      title: "",
      story: "",
      scenarioCount: 2,
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: InsertFeature) => {
      const res = await apiRequest("POST", "/api/features/generate", data);
      const json = await res.json();
      return json;
    },
    onSuccess: (data) => {
      setGeneratedFeature(data.generatedContent);
      toast({
        title: "Success",
        description: "Feature generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFeature) => {
    generateMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Feature Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate Cucumber features using AI
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter feature title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="story"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Story</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter feature story"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scenarioCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Scenarios</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value, 10))
                        }
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of scenarios" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <SelectItem
                              key={num}
                              value={num.toString()}
                            >
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    "Generating..."
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Feature
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {generatedFeature && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {generatedFeature}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
