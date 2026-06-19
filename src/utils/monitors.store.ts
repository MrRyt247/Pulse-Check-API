import { LocalStorage } from "node-localstorage";
import Monitor from "./model.js";

const localStorage = new LocalStorage("./scratch");

const timers = new Map<string, NodeJS.Timeout>();

export function getMonitor(id: string): Monitor | null {
  const raw = localStorage.getItem(id);
  return raw === null ? null : (JSON.parse(raw) as Monitor);
}

export function saveMonitor(monitor: Monitor): void {
  localStorage.setItem(monitor.id, JSON.stringify(monitor));
}

export function deleteMonitor(id: string): void {
  clearTimer(id);
  localStorage.removeItem(id);
}

function clearTimer(id: string): void {
  const existing = timers.get(id);
  if (existing) {
    clearTimeout(existing);
    timers.delete(id);
  }
}

// Fires when a monitor misses its deadline: mark it down and (later) alert.
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
