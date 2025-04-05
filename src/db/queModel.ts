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
    fs.writeFileSync(timelinePath, JSON.stringify([]));
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

// === Clean math-only shift logic ===
function calculateVolunteeredHoursSimple(leaveTime: Date): number {
  const hour = leaveTime.getHours();
  const minutes = leaveTime.getMinutes();
  let leaveDecimal = hour + minutes / 60;

  // Treat anything after midnight as 24+ hour float
  if (leaveDecimal < 7) {
    leaveDecimal += 24;
  }

  const shiftStart = 19.0; // 7 PM
  const shiftEnd = 31.0;   // 7 AM (next day)

  if (leaveDecimal < shiftStart || leaveDecimal > shiftEnd) {
    return 0;
  }

  const volunteered = shiftEnd - leaveDecimal;
  return Math.round(volunteered * 100) / 100;
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

    const hoursVolunteered = calculateVolunteeredHoursSimple(leaveTime);
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
