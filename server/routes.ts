import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFeature, analyzeFeature, suggestTitle, analyzeFeatureComplexity } from "./openai";
import { insertFeatureSchema, updateFeatureSchema } from "@shared/schema";
import fs from "fs-extra";
import path from "path";
import { requireAuth } from "./auth";
import JSZip from 'jszip';

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
  
  // Admin route - delete a feature
  app.delete("/api/admin/features/:id", requireAdmin, async (req, res) => {
    try {
      const featureId = parseInt(req.params.id, 10);
      if (isNaN(featureId)) {
        return res.status(400).json({ message: "Invalid feature ID" });
      }
      
      const feature = await storage.getFeature(featureId);
      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }
      
      const deletedFeature = await storage.softDeleteFeature(featureId);
      
      // Track deletion in analytics
      await storage.trackEvent({
        eventType: "feature_deletion",
        successful: true,
        errorMessage: null,
      });
      
      res.json(deletedFeature);
    } catch (error: any) {
      console.error("Error deleting feature:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin route - restore a deleted feature
  app.post("/api/admin/features/:id/restore", requireAdmin, async (req, res) => {
    try {
      const featureId = parseInt(req.params.id, 10);
      if (isNaN(featureId)) {
        return res.status(400).json({ message: "Invalid feature ID" });
      }
      
      const feature = await storage.getFeature(featureId);
      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }
      
      const restoredFeature = await storage.restoreFeature(featureId);
      res.json(restoredFeature);
    } catch (error: any) {
      console.error("Error restoring feature:", error);
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

  app.delete("/api/features/:id/permanent", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the current user from session
      const userId = req.session.userId;
      const user = await storage.getUser(userId!);
      
      // Only allow admins to permanently delete features
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Only admins can permanently delete features" });
      }
      
      const success = await storage.permanentlyDeleteFeature(id);
      if (!success) {
        return res.status(404).json({ message: "Feature not found" });
      }
      
      res.json({ success: true, message: "Feature permanently deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/features/export/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.getFeature(id);

      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      // Format the feature content for download
      const content = feature.generatedContent;
      const filename = `${feature.title.toLowerCase().replace(/\s+/g, '_')}.doc`;

      // Set headers for Word document download
      res.setHeader('Content-Type', 'application/msword');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      res.send(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/export-multiple", requireAuth, async (req, res) => {
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