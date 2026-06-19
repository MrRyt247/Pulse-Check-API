import { Router } from "express";
import type { Request, Response } from "express";
import Monitor from "../utils/model.js";
import {
  resetTimer,
  getMonitor,
  heartbeat,
  saveMonitor,
} from "../utils/monitors.store.js";

const monitorRoutes = Router();

monitorRoutes.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello from monitors",
  });
});

// Admin creates a device
monitorRoutes.post("/", (req: Request, res: Response) => {
  const { id, timeout, alert_email } = req.body;

  if (getMonitor(id) !== null)
    return res.status(400).send("Monitor already exists");

  const monitor: Monitor = {
    id,
    timeout,
    alert_email,
    status: "active",
    createdAt: Date.now(),
    lastSeen: Date.now(),
  };
  saveMonitor(monitor);
  resetTimer(monitor);

  res.status(201).send({ message: `Monitor ${id} registered for ${timeout}s` });
});

// Device pings server — resets the countdown
monitorRoutes.post("/:id/heartbeat", (req: Request, res: Response) => {
  const id = String(req.params.id);

  const monitor = heartbeat(id);
  if (!monitor) return res.status(404).send("Not found");

  res.status(200).send({ message: `Monitor ${id} heartbeat` });
});

// Pause -  can only active

// Delete

// Edit

export default monitorRoutes;
