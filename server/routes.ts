import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFeature } from "./openai";
import { Feature, FeatureFilter } from "@shared/schema";
import fs from "fs-extra";
import path from "path";
import { requireAuth } from "./auth";
import JSZip from 'jszip';

export async function registerRoutes(app: Express): Promise<Server> {
  // Features routes
  app.get("/api/features", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const filter = (req.query.filter as FeatureFilter) || "active";

      const features = await storage.getFeatures(userId, filter);
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/features/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const feature = await storage.getFeature(req.params.id);

      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      // Log feature view
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

  app.post("/api/features", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { title, description } = req.body;

      // Generate feature using OpenAI
      let featureData: Partial<Feature>;
      let successful = true;
      let errorMessage = null;
      let scenarioCount = 0;

      try {
        featureData = await generateFeature(title, description);
        scenarioCount = featureData.scenarios?.length || 0;
      } catch (error: any) {
        successful = false;
        errorMessage = error.message;
        featureData = {
          title,
          story: description,
          scenarios: [],
        };
      }

      // Save feature to database
      const feature = await storage.createFeature({
        ...featureData,
        userId,
      });

      // Log analytics event
      await storage.logAnalyticsEvent({
        userId,
        eventType: "feature_generation",
        featureId: feature.id,
        successful,
        errorMessage,
        scenarioCount,
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

      const feature = await storage.updateFeature(req.params.id, {
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

      await storage.softDeleteFeature(req.params.id);
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

      await storage.restoreFeature(req.params.id);
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

      const analyticsData = await storage.getAnalytics(Number(userId));
      res.json(analyticsData);
    } catch (error: any) {
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
        featureIds.map(id => storage.getFeature(id))
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
        zip.file(filename, feature.generatedContent);
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