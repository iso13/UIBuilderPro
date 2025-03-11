import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFeature, analyzeFeature, suggestTitle, analyzeFeatureComplexity } from "./openai";
import { insertFeatureSchema, updateFeatureSchema } from "@shared/schema";
import fs from "fs-extra";
import path from "path";
import { requireAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Protected route - only authenticated users can access features
  app.get("/api/features", requireAuth, async (_req, res) => {
    try {
      const includeDeleted = _req.query.includeDeleted === 'true';
      const features = await storage.getAllFeatures(includeDeleted);
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/generate", requireAuth, async (req, res) => {
    try {
      const data = insertFeatureSchema.parse(req.body);

      // Check for duplicate title
      const existingFeature = await storage.findFeatureByTitle(data.title);
      if (existingFeature) {
        return res.status(400).json({ 
          message: "A feature with this title already exists. Please use a different title." 
        });
      }

      // Track generation attempt
      const analyticsEvent = {
        eventType: "feature_generation",
        scenarioCount: data.scenarioCount,
        successful: false,
        errorMessage: null,
      };

      try {
        const generatedContent = await generateFeature(
          data.title,
          data.story,
          data.scenarioCount
        );

        const feature = await storage.createFeature({
          ...data,
          generatedContent,
          manuallyEdited: false,
        });

        // Update analytics with success
        analyticsEvent.successful = true;
        await storage.trackEvent(analyticsEvent);

        res.json(feature);
      } catch (error: any) {
        // Update analytics with error
        analyticsEvent.errorMessage = error.message;
        await storage.trackEvent(analyticsEvent);
        throw error;
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/features/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = updateFeatureSchema.parse(req.body);

      // Get the current feature
      const currentFeature = await storage.getFeature(id);
      if (!currentFeature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      // If title is being changed, check for duplicates
      if (data.title && data.title !== currentFeature.title) {
        const existingFeature = await storage.findFeatureByTitle(data.title);
        if (existingFeature && existingFeature.id !== id) {
          return res.status(400).json({ 
            message: "A feature with this title already exists. Please use a different title." 
          });
        }
      }

      // If scenarioCount changed or title changed, always regenerate
      if ((data.scenarioCount && data.scenarioCount !== currentFeature.scenarioCount) ||
          (data.title && data.title !== currentFeature.title)) {
        // First update the feature's basic info
        await storage.updateFeature(id, {
          title: data.title,
          story: data.story,
          scenarioCount: data.scenarioCount,
        });

        // Then regenerate content with updated information
        const generatedContent = await generateFeature(
          data.title || currentFeature.title,
          data.story || currentFeature.story,
          data.scenarioCount || currentFeature.scenarioCount
        );

        const feature = await storage.updateFeature(id, {
          generatedContent,
          manuallyEdited: false,
        });

        return res.json(feature);
      }

      // Regular update without regenerating content
      const feature = await storage.updateFeature(id, {
        ...data,
        manuallyEdited: data.generatedContent ? true : currentFeature.manuallyEdited,
      });

      res.json(feature);
    } catch (error: any) {
      console.error('Error updating feature:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/features/:id/delete", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.softDeleteFeature(id);
      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }
      res.json(feature);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/:id/restore", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.restoreFeature(id);
      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }
      res.json(feature);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics", requireAuth, async (_req, res) => {
    try {
      const analyticsData = await storage.getAnalytics();
      res.json(analyticsData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/:id/analyze", requireAuth, async (req, res) => {
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

  app.post("/api/features/:id/complexity", requireAuth, async (req, res) => {
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

  app.post("/api/features/suggest-titles", requireAuth, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}