import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFeature, analyzeFeature, suggestTitle, analyzeFeatureComplexity } from "./openai";
import { insertFeatureSchema, updateFeatureSchema } from "@shared/schema";
import fs from "fs-extra";
import path from "path";

type FeatureStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/features", async (_req, res) => {
    try {
      const includeDeleted = _req.query.includeDeleted === 'true';
      const features = await storage.getAllFeatures(includeDeleted);
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/generate", async (req, res) => {
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

  app.patch("/api/features/:id", async (req, res) => {
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
        console.log(`Regenerating content for feature ${id} with title: ${data.title || currentFeature.title} and ${data.scenarioCount || currentFeature.scenarioCount} scenarios`);

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

  app.post("/api/features/:id/delete", async (req, res) => {
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

  app.post("/api/features/:id/restore", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.restoreFeature(id);
      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      // When restoring, reset status to DRAFT
      const updatedFeature = await storage.updateFeature(id, { 
        status: "DRAFT" 
      });

      res.json(updatedFeature);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics", async (_req, res) => {
    try {
      const analyticsData = await storage.getAnalytics();
      res.json(analyticsData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/:id/analyze", async (req, res) => {
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

  app.post("/api/features/:id/complexity", async (req, res) => {
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

  app.post("/api/features/suggest-titles", async (req, res) => {
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

  app.post("/api/features/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body as { status: FeatureStatus };

      if (!["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const feature = await storage.getFeature(id);
      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      // Prevent status changes for archived features
      if (feature.deleted) {
        return res.status(400).json({ 
          message: "Cannot change status of archived features" 
        });
      }

      // Add validation rules for status transitions
      const validTransitions: Record<FeatureStatus, FeatureStatus[]> = {
        "DRAFT": ["IN_REVIEW"],
        "IN_REVIEW": ["APPROVED", "REJECTED", "DRAFT"],
        "APPROVED": ["IN_REVIEW"],
        "REJECTED": ["DRAFT"]
      };

      if (!validTransitions[feature.status]?.includes(status as FeatureStatus)) {
        return res.status(400).json({ 
          message: `Invalid status transition from ${feature.status} to ${status}` 
        });
      }

      const updatedFeature = await storage.updateFeature(id, { status });
      res.json(updatedFeature);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.getFeature(id);

      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      if (feature.status !== "APPROVED") {
        return res.status(400).json({ 
          message: "Only approved features can be exported" 
        });
      }

      if (!feature.generatedContent) {
        return res.status(400).json({ message: "Feature has no content to export" });
      }

      // Create features directory if it doesn't exist
      const featuresDir = path.join(process.cwd(), "src", "features");
      await fs.ensureDir(featuresDir);

      // Generate safe filename from feature title
      const safeFilename = feature.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const featureFilePath = path.join(featuresDir, `${safeFilename}.feature`);

      // Write feature content to file
      await fs.writeFile(featureFilePath, feature.generatedContent);

      res.json({
        message: "Feature exported successfully",
        filePath: featureFilePath
      });
    } catch (error: any) {
      console.error("Error exporting feature:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}