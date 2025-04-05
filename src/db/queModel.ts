import fs from "fs";
import path from "path";
import { Employee } from "../types/types";

// Queue paths + lock
const filePath = path.join(__dirname, "queue.json");
const lockedIds = new Set<number>();

// Timeline paths
const timelinePath = path.join(__dirname, "timeline.json");

// Ensure timeline file exists or create an empty one
function ensureTimelineFileExists() {
  if (!fs.existsSync(timelinePath)) {
    fs.writeFileSync(timelinePath, JSON.stringify([])); // Create an empty array if the file doesn't exist
  }
}

export function getQueue(): Employee[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw).sort((a: Employee, b: Employee) => a.position - b.position);
}

export function saveQueue(queue: Employee[]) {
  fs.writeFileSync(filePath, JSON.stringify(queue, null, 2));
}

function getTimeline() {
  ensureTimelineFileExists();
  const raw = fs.readFileSync(timelinePath, "utf-8");
  return JSON.parse(raw);
}

function saveTimeline(timeline: any[]) {
  fs.writeFileSync(timelinePath, JSON.stringify(timeline, null, 2));
}

// === Shift logic helper (fixed) ===
function calculateNightShiftVolunteeredHours(leaveTime: Date): number {
  const shiftStart = new Date(leaveTime);
  shiftStart.setHours(19, 0, 0, 0); // 7 PM

  // If before 7 AM, shift started the previous day
  if (leaveTime.getHours() < 7) {
    shiftStart.setDate(shiftStart.getDate() - 1);
  }

  const shiftEnd = new Date(shiftStart);
  shiftEnd.setDate(shiftStart.getDate() + 1); // move to next day
  shiftEnd.setHours(7, 0, 0, 0); // 7 AM next morning

  if (leaveTime < shiftStart || leaveTime > shiftEnd) return 0;

  const msRemaining = shiftEnd.getTime() - leaveTime.getTime();
  const hours = msRemaining / (1000 * 60 * 60);

  return Math.round(Math.max(0, Math.min(12, hours)) * 100) / 100;
}

export function volunteerEmployee(id: number): Employee[] | null {
  if (lockedIds.has(id)) {
    console.warn(`Race blocked: ID ${id} is already being updated`);
    return null;
  }

  lockedIds.add(id);

  try {
    const queue = getQueue();
    const index = queue.findIndex((emp) => emp.id === id);
    if (index === -1) return null;

    const [volunteer] = queue.splice(index, 1);
    const leaveTime = new Date();

    // Update fields
    volunteer.lastVolunteeredOn = leaveTime.toISOString();
    volunteer.wentHome = (volunteer.wentHome || 0) + 1;

    const hoursVolunteered = calculateNightShiftVolunteeredHours(leaveTime);
    volunteer.totalTimeVolunteered = (volunteer.totalTimeVolunteered || 0) + hoursVolunteered;

    // Re-add and reindex queue
    queue.push(volunteer);
    queue.forEach((emp, idx) => {
      emp.position = idx + 1;
    });

    saveQueue(queue);

    // Update timeline
    const timeline = getTimeline();
    timeline.push({
      id: Date.now(),
      name: volunteer.name,
      profilePic: volunteer.profilePic || "",
      timestamp: leaveTime.toISOString(),
      hoursVolunteered: hoursVolunteered,
      totalTimeVolunteered: volunteer.totalTimeVolunteered,
    });
    saveTimeline(timeline);

    return queue;
  } finally {
    lockedIds.delete(id);
  }
}
