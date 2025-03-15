import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth";
import { setupVite, serveStatic, log } from "./vite";
import ConnectPgSimple from "connect-pg-simple";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
const pgSession = ConnectPgSimple(session);
app.use(session({
  store: new pgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: 'require'
    },
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    sameSite: 'lax'
  },
}));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate long log lines
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Top-level error handler for uncaught promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

(async () => {
  try {
    log('Starting server initialization...');

    // Register auth routes first
    await registerAuthRoutes(app);
    log('Auth routes registered');

    // Register API routes
    const server = await registerRoutes(app);
    log('API routes registered');

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Error:", err);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
      log('Vite middleware setup complete');
    } else {
      serveStatic(app);
      log('Static file serving setup complete');
    }

    // Fixed port configuration
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server started successfully and listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();