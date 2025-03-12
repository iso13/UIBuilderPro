import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "./card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { MoreVertical } from "lucide-react";
import type { Feature } from "@shared/schema";

export function FeatureList() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [, navigate] = useLocation();

  const { data: features = [], isLoading } = useQuery<Feature[]>({
    queryKey: ["/api/features"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Features</h1>
          <Button onClick={() => navigate("/new")}>Generate New Feature</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 space-y-4">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Features</h1>
        <Button onClick={() => navigate("/new")} className="bg-primary text-primary-foreground">
          Generate New Feature
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!features || features.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">No features found. Create your first feature!</p>
          </div>
        ) : (
          <AnimatePresence>
            {features.map((feature) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onClick={() => setSelectedFeature(feature)}
              >
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full bg-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <Button variant="ghost" size="icon" className="mt-[-8px] mr-[-8px]">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground mb-4 line-clamp-3">{feature.story}</p>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(feature.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <Dialog open={selectedFeature !== null} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFeature?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Story</h4>
              <p className="text-muted-foreground">{selectedFeature?.story}</p>
            </div>
            {selectedFeature?.generatedContent && (
              <div>
                <h4 className="text-sm font-medium mb-2">Generated Content</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-sm">
                  {selectedFeature.generatedContent}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}