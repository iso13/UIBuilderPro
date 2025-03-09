import type { Express } from "express";
import { createServer, type Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { storage } from "./storage";
import { generateFeature } from "./openai";
import { insertFeatureSchema, updateFeatureSchema, insertAnalyticsSchema, type WebSocketMessage } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/features", async (_req, res) => {
    try {
      const features = await storage.getAllFeatures();
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/features/generate", async (req, res) => {
    try {
      const data = insertFeatureSchema.parse(req.body);

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

      let feature = await storage.updateFeature(id, {
        ...data,
        manuallyEdited: data.generatedContent ? true : undefined,
      });

      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }

      // Only regenerate content if story/scenarioCount changed and content wasn't manually edited
      if (!data.generatedContent && (data.story || data.scenarioCount)) {
        const updatedFeature = await storage.getFeature(id);
        if (updatedFeature && !updatedFeature.manuallyEdited) {
          const generatedContent = await generateFeature(
            updatedFeature.title,
            updatedFeature.story,
            updatedFeature.scenarioCount
          );

          feature = await storage.updateFeature(id, {
            generatedContent,
            manuallyEdited: false,
          });
        }
      }

      res.json(feature);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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

  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        console.log('Received WebSocket message:', message);

        switch (message.type) {
          case 'start_editing':
            await storage.updateFeature(message.featureId, {
              activeEditor: message.userId,
              activeEditorTimestamp: new Date(),
            });
            break;
          case 'stop_editing':
            await storage.updateFeature(message.featureId, {
              activeEditor: null,
              activeEditorTimestamp: null,
            });
            break;
        }

        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}