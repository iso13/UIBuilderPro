import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
import { insertFeatureSchema, type InsertFeature, type Feature } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentFeature, setCurrentFeature] = useState<Feature | null>(null);

  const form = useForm<InsertFeature>({
    resolver: zodResolver(insertFeatureSchema),
    defaultValues: {
      title: "",
      story: "",
      scenarioCount: 2,
    },
  });

  const { data: features = [] } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: InsertFeature) => {
      const res = await apiRequest("POST", "/api/features/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentFeature(data);
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      form.reset();
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8"
      >
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Feature Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate Cucumber features using AI
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Generate New Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter feature title" {...field} />
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
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of scenarios" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
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
                    <span className="flex items-center gap-2">
                      <LoadingSpinner />
                      Generating...
                    </span>
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

        {currentFeature && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentFeature.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Story</h4>
                  <p className="text-sm text-muted-foreground">{currentFeature.story}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Generated Content</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-sm">
                    {currentFeature.generatedContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Generated Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {features.map((feature: Feature) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      currentFeature?.id === feature.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setCurrentFeature(feature)}
                  >
                    <h3 className="text-lg font-semibold truncate">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {feature.story}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {features.length === 0 && (
                <div className="text-center text-muted-foreground col-span-full">
                  No features generated yet. Try generating one above!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}