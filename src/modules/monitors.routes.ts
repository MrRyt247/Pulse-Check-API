import { Router } from "express";
import type { Request, Response } from "express";
import { LocalStorage } from "node-localstorage";
import Monitor from "../utils/utils.js";

const monitorRoutes = Router();

const localStorage = new LocalStorage("./scratch");

monitorRoutes.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello from monitors",
  });
});

// Admin creates a device
monitorRoutes.post("/", (req: Request, res: Response) => {
  const { id, timeout, alert_email } = req.body;

  if (localStorage.getItem(id) !== null)
    return res.status(400).send("Monitor already exists");

  const monitor: Monitor = {
    id,
    timeout,
    alert_email,
    status: "active",
  };
  localStorage.setItem(id, JSON.stringify(monitor));

  res.status(201).send({ message: `Monitor ${id} registered for ${timeout}s` });
});

// Device pings server

// Alert

// Pause -  can only active

// Delete

// Edit

export default monitorRoutes;
