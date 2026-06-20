import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import monitorRoutes from "./modules/monitors.routes.js";
import { rehydrateTimers } from "./utils/monitors.store.js";

const PORT = process.env.PORT ?? 3000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "*";

const app = express();
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Re-arm timers for monitors persisted before the last restart.
rehydrateTimers();

// Routes

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello from Pulse-Check",
  });
});
app.use("/monitors", monitorRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
