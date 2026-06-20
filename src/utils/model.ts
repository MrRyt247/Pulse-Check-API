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

export const updateMonitorSchema = z
  .object({
    timeout: z.coerce.number().int().positive().optional(),
    alert_email: z.email().optional(),
  })
  .refine((data) => data.timeout !== undefined || data.alert_email !== undefined, {
    message: "Provide timeout and/or alert_email to update",
  });

export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;

