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

