import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./card";
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Generated Features</h1>
            <Button onClick={() => navigate("/new")} className="bg-blue-500 text-white">
              Generate New Feature
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-black rounded-lg p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Generated Features</h1>
          <Button onClick={() => navigate("/new")} className="bg-blue-500 text-white">
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
                >
                  <Card className="bg-black hover:bg-black/70 transition-colors cursor-pointer h-full">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 line-clamp-3">{feature.story}</p>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(feature.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}