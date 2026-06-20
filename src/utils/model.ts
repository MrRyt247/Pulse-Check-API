import { z } from "zod";

export default interface Monitor {
  id: string;
  timeout: number;
  alert_email: string;
  status: "active" | "paused" | "down";
  createdAt: number;
  lastSeen: number;
}

export type PauseOutcome =
  | "not found"
  | "already down"
  | "already paused"
  | "paused";

// Validation schema for registering a monitor (POST): all fields required.
export const createMonitorSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
  timeout: z.coerce.number().int().positive(),
  alert_email: z.email(),
});

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;

export const updateMonitorSchema = z
  .object({
    timeout: z.coerce.number().int().positive().optional(),
    alert_email: z.email().optional(),
  })
  .refine((data) => data.timeout !== undefined || data.alert_email !== undefined, {
    message: "Provide timeout and/or alert_email to update",
  });

export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;

