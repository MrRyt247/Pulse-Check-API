import express from "express";
import type { Request, Response } from "express";
import monitorRoutes from "./modules/monitors.routes.js";

const app = express();
app.use(express.json());

// Routes

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello from Pulse-Check",
  });
});
app.use("/monitors", monitorRoutes);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
