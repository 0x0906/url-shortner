import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { ApiError } from "./errors/ApiError";
import { authMiddleware } from "./middleware/auth";
import { rateLimiter } from "./middleware/rateLimiter";
import authRoutes from "./routes/auth";
import urlRoutes from "./routes/urls";
import analyticsRoutes from "./routes/analytics";
import redirectRoutes from "./routes/redirect";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = parseInt(process.env.PORT || "5000");
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(rateLimiter);
app.use(authMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/urls", urlRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use(redirectRoutes);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
