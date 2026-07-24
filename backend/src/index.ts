import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { initDatabase } from "./db.js";
import { GoDaddyClient } from "./godaddy.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { createDomainsRouter } from "./routes/domains.js";
import { errorHandler } from "./middleware/error.js";

async function main() {
  await initDatabase();

  const app = express();
  const godaddy = new GoDaddyClient(
    config.godaddy.baseUrl,
    config.godaddy.apiKey,
    config.godaddy.apiSecret
  );

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "dns-manage",
      env: config.nodeEnv,
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/domains", createDomainsRouter(godaddy));

  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`DNS Manage API running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
