import { Router } from "express";
import type { Request, Response } from "express";
import Monitor, { updateMonitorSchema } from "../utils/model.js";
import {
  resetTimer,
  getMonitor,
  heartbeat,
  saveMonitor,
  pauseMonitor,
  deleteMonitor,
  updateMonitor,
  getAllMonitors,
} from "../utils/monitors.store.js";

const monitorRoutes = Router();

// Admin creates a device
monitorRoutes.post("/", (req: Request, res: Response) => {
  const { id, timeout, alert_email } = req.body;

  if (getMonitor(id) !== null)
    return res.status(400).send({ error: `Monitor ${id} already exists` });

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
  if (!monitor)
    return res.status(404).send({ error: `Monitor ${id} not found` });

  res.status(200).send({ message: `Monitor ${id} heartbeat` });
});

// Pause — stops the countdown for an active monitor
monitorRoutes.post("/:id/heartbeat/pause", (req: Request, res: Response) => {
  const id = String(req.params.id);

  switch (pauseMonitor(id)) {
    case "not found":
      return res.status(404).send({ error: `Monitor ${id} not found` });
    case "already down":
      return res.status(409).send({ error: `Monitor ${id} is already down` });
    case "already paused":
      return res.status(409).send({ error: `Monitor ${id} is already paused` });
    case "paused":
      return res.status(200).send({ message: `Monitor ${id} paused` });
  }
});

// Delete - removes an existing monitor
monitorRoutes.delete("/:id", (req: Request, res: Response) => {
  const id = String(req.params.id);

  const monitor = deleteMonitor(id);
  if (!monitor)
    return res.status(404).send({ error: `Monitor ${id} not found` });

  res.status(200).send({ message: `Monitor ${id} deleted` });
});

// Admin edits monitor details
monitorRoutes.patch("/:id", (req: Request, res: Response) => {
  const id = String(req.params.id);

  const parsed = updateMonitorSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .send({ error: parsed.error.issues.map((issue) => issue.message) });

  const monitor = updateMonitor(id, parsed.data);
  if (!monitor)
    return res.status(404).send({ error: `Monitor ${id} not found` });

  res.status(200).send({ message: `Monitor ${id} updated` });
});

// Admin gets all monitors
monitorRoutes.get("/", (req: Request, res: Response) => {
  const monitors = getAllMonitors();
  res.status(200).send({ count: monitors.length, monitors });
});

export default monitorRoutes;
