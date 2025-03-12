import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "@shared/schema";

// Extend session interface to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Admin middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Get the user to check if they're an admin
  storage.getUser(req.session.userId)
    .then(user => {
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      next();
    })
    .catch(error => {
      console.error("Admin middleware error:", error);
      res.status(500).json({ message: "Server error checking admin privileges" });
    });
};

// Authentication routes
export async function registerAuthRoutes(app: any) {
  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(data.password, salt);

      // Create user
      const user = await storage.createUser({
        email: data.email,
        passwordHash,
        isAdmin: false
      });

      // Start session
      req.session.userId = user.id;

      res.json({ 
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Start session
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to establish session" });
        }
        res.json({ 
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin
        });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "No active session" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.json(null);
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.json(null);
    }

    res.json({
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    });
  });
}