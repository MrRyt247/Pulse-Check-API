import { LocalStorage } from "node-localstorage";
import Monitor, { PauseOutcome } from "./model.js";

const localStorage = new LocalStorage("./scratch");
const timers = new Map<string, NodeJS.Timeout>();

export function getMonitor(id: string): Monitor | null {
  const raw = localStorage.getItem(id);
  return raw === null ? null : (JSON.parse(raw) as Monitor);
}

export function saveMonitor(monitor: Monitor): void {
  localStorage.setItem(monitor.id, JSON.stringify(monitor));
}

function clearTimer(id: string): void {
  const existing = timers.get(id);
  if (existing) {
    clearTimeout(existing);
    timers.delete(id);
  }
}

// Alert logic
function fireAlert(id: string): void {
  const monitor = getMonitor(id);
  if (!monitor) return;

  monitor.status = "down";
  saveMonitor(monitor);
  timers.delete(id);

  // TODO: trigger the alert (email to monitor.alert_email).
  console.log(
    `Monitor ${id} is DOWN — no heartbeat within ${monitor.timeout}s`,
  );
}

// Reset logic
export function resetTimer(
  monitor: Monitor,
  delayMs = monitor.timeout * 1000,
): void {
  clearTimer(monitor.id);
  if (monitor.status !== "active") return;

  const timer = setTimeout(() => fireAlert(monitor.id), Math.max(0, delayMs));
  timers.set(monitor.id, timer);
}

export function heartbeat(id: string): Monitor | null {
  const monitor = getMonitor(id);
  if (!monitor) return null;

  monitor.lastSeen = Date.now();
  monitor.status = "active";
  saveMonitor(monitor);
  resetTimer(monitor);
  return monitor;
}

export function rehydrateTimers(): void {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const monitor = getMonitor(key);
    if (!monitor || monitor.status !== "active") continue;

    const remainingMs =
      monitor.timeout * 1000 - (Date.now() - monitor.lastSeen);
    resetTimer(monitor, remainingMs);
  }
}

// Pause logic
export function pauseMonitor(id: string): PauseOutcome {
  const monitor = getMonitor(id);
  if (!monitor) return "not found";
  if (monitor.status === "down") return "already down";
  if (monitor.status === "paused") return "already paused";

  monitor.status = "paused";
  saveMonitor(monitor);
  clearTimer(monitor.id);
  return "paused";
}

// Delete logic
export function deleteMonitor(id: string): Monitor | null {
  const monitor = getMonitor(id);
  if (!monitor) return null;

  clearTimer(id);
  localStorage.removeItem(id);
  return monitor;
}

// Edit logic
export function updateMonitor(
  id: string,
  patch: { timeout?: number; alert_email?: string },
): Monitor | null {
  const monitor = getMonitor(id);
  if (!monitor) return null;

  const timeoutChanged =
    patch.timeout !== undefined && patch.timeout !== monitor.timeout;

  if (patch.timeout !== undefined) monitor.timeout = patch.timeout;
  if (patch.alert_email !== undefined) monitor.alert_email = patch.alert_email;

  saveMonitor(monitor);
  if (timeoutChanged) resetTimer(monitor);

  return monitor;
}
