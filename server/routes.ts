import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./auth";
import { FeatureFilter } from "@shared/schema";
import { generateFeature } from "./openai";
import { Feature } from "@shared/schema";
import JSZip from "jszip";

export async function registerRoutes(app: Express): Promise<Server> {
  // Features routes
  app.post("/api/features", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { title, story, scenarioCount = 3 } = req.body;

      if (!title || !story) {
        return res.status(400).json({ message: "Title and story are required" });
      }

      console.log(`Generating feature with title: ${title}, story: ${story}, scenarioCount: ${scenarioCount}`);

      // Generate feature using OpenAI
      let featureContent: string;
      let successful = true;
      let errorMessage = null;
      let actualScenarioCount = scenarioCount;

      try {
        const generatedFeature = await generateFeature(title, story, actualScenarioCount);
        featureContent = generatedFeature;
      } catch (error: any) {
        console.error("Error generating feature with OpenAI:", error);
        successful = false;
        errorMessage = error.message;
        featureContent = "";
      }

      console.log("Feature content generated:", featureContent);

      // Save feature to database
      const feature = await storage.createFeature({
        title,
        story,
        generatedContent: featureContent,
        scenarioCount,
        userId,
      });

      console.log(`Feature created with ID: ${feature.id}`);

      // Log analytics event
      await storage.logAnalyticsEvent({
        userId,
        eventType: "feature_generation",
        featureId: feature.id,
        successful,
        errorMessage,
        scenarioCount: actualScenarioCount,
      });

      res.json(feature);
    } catch (error: any) {
      console.error("Error in feature creation endpoint:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/features", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const filter = (req.query.filter as FeatureFilter) || "active";
      console.log("Fetching features with filter:", filter);

      let features = await storage.getAllFeatures(filter === "all");
      features = Array.isArray(features) ? features : [];

      return res.json(features);
    } catch (error: any) {
      console.error("Error fetching features:", error);
      return res.status(500).json({ message: "Failed to fetch features" });
    }
  });

  app.get("/api/features/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const featureId = parseInt(req.params.id);
      const feature = await storage.getFeature(featureId);

      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      await storage.logAnalyticsEvent({
        userId,
        eventType: "feature_view",
        featureId: feature.id,
        successful: true,
        errorMessage: null,
        scenarioCount: null,
      });

      res.json(feature);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/features/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { title, story, scenarios } = req.body;

      const featureId = parseInt(req.params.id); //Convert to number
      const feature = await storage.updateFeature(featureId, {
        title,
        story,
        scenarios,
      });

      res.json(feature);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/features/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const featureId = parseInt(req.params.id); //Convert to number
      await storage.softDeleteFeature(featureId);
      res.json({ message: "Feature moved to trash" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/:id/restore", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const featureId = parseInt(req.params.id); //Convert to number
      await storage.restoreFeature(featureId);
      res.json({ message: "Feature restored" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  app.get("/api/analytics", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("Fetching analytics for user:", userId); 
      const analyticsData = await storage.getAnalytics(userId);
      console.log("Analytics data:", analyticsData); 

      res.json(analyticsData);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/:id/analyze", requireAuth, async (req: Request, res: Response) => {
      try {
          const id = parseInt(req.params.id);
          const feature = await storage.getFeature(id);

          if (!feature) {
              return res.status(404).json({ message: "Feature not found" });
          }

          if (!feature.generatedContent) {
              return res.status(400).json({ message: "Feature has no content to analyze" });
          }

          const analysis = await analyzeFeature(feature.generatedContent, feature.title);
          res.json(analysis);
      } catch (error: any) {
          res.status(500).json({ message: error.message });
      }
  });

  app.post("/api/features/:id/complexity", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log(`Analyzing complexity for feature ${req.params.id}`);
      const id = parseInt(req.params.id);
      const feature = await storage.getFeature(id);

      if (!feature) {
        console.log(`Feature ${id} not found`);
        return res.status(404).json({ message: "Feature not found" });
      }

      if (!feature.generatedContent) {
        console.log(`Feature ${id} has no content to analyze`);
        return res.status(400).json({ message: "Feature has no content to analyze" });
      }

      console.log(`Starting complexity analysis for feature ${id}`);
      const complexity = await analyzeFeatureComplexity(feature.generatedContent);
      console.log(`Completed complexity analysis for feature ${id}`);

      res.json(complexity);
    } catch (error: any) {
      console.error(`Error analyzing complexity for feature ${req.params.id}:`, error);
      res.status(500).json({ message: error.message });
    }
  });

    app.post("/api/features/suggest-titles", requireAuth, async (req: Request, res: Response) => {
        try {
            const { story } = req.body;
            if (!story) {
                return res.status(400).json({ message: "Story is required" });
            }

            const titles = await suggestTitle(story);
            res.json({ titles });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    });


  app.post("/api/features/export-multiple", requireAuth, async (req: Request, res: Response) => {
    try {
      const { featureIds } = req.body;

      if (!Array.isArray(featureIds) || featureIds.length === 0) {
        return res.status(400).json({ message: "No features selected for export" });
      }

      const features = await Promise.all(
        featureIds.map(id => storage.getFeature(parseInt(id))) //Convert to number
      );

      // Filter out any null results
      const validFeatures = features.filter((f): f is NonNullable<typeof f> => f !== null);

      if (validFeatures.length === 0) {
        return res.status(404).json({ message: "No valid features found" });
      }

      // Create a zip file containing all feature files
      const zip = new JSZip();

      validFeatures.forEach(feature => {
        const filename = `${feature.title.toLowerCase().replace(/\s+/g, '_')}.doc`;
        zip.file(filename, feature.generatedContent || ""); // Handle potential null generatedContent
      });

      const zipContent = await zip.generateAsync({ type: "nodebuffer" });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=features.zip');

      res.send(zipContent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}