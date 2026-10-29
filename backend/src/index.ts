import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { initDb, pool } from "./config/db";

const PORT = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  try {
    await initDb();
    console.log("PostgreSQL database connected and tables verified.");

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    const shutdown = async () => {
      console.log("\nShutting down server gracefully...");
      server.close(async () => {
        await pool.end();
        console.log("Database pool closed. Process terminated.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    console.error("Failed to initialize backend database:", err);
    process.exit(1);
  }
}

startServer();
