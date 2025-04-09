import fs from "fs";
import path from "path";
import { Employee } from "../types/types";

// === Paths + Locks ===
const filePath = path.join(__dirname, "queue.json");
const timelinePath = path.join(__dirname, "timeline.json");
const lockedIds = new Set<number>();

// === Queue Management ===
export function getQueue(): Employee[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw).sort((a: Employee, b: Employee) => a.position - b.position);
}

export function saveQueue(queue: Employee[]) {
  fs.writeFileSync(filePath, JSON.stringify(queue, null, 2));
}

// === Timeline Management ===
function ensureTimelineFileExists() {
  if (!fs.existsSync(timelinePath)) {
    fs.writeFileSync(timelinePath, JSON.stringify([]));
  }
}

function getTimeline() {
  ensureTimelineFileExists();
  const raw = fs.readFileSync(timelinePath, "utf-8");
  return JSON.parse(raw);
}

function saveTimeline(timeline: any[]) {
  fs.writeFileSync(timelinePath, JSON.stringify(timeline, null, 2));
}

// === Core Volunteer Logic ===
export function volunteerEmployee(id: number, hoursVolunteered: number): Employee[] | null {
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

    volunteer.lastVolunteeredOn = leaveTime.toISOString();
    volunteer.wentHome = (volunteer.wentHome || 0) + 1;
    volunteer.totalTimeVolunteered = (volunteer.totalTimeVolunteered || 0) + hoursVolunteered; // Accumulate total time

    queue.push(volunteer);
    queue.forEach((emp, idx) => (emp.position = idx + 1));
    saveQueue(queue);

    const timeline = getTimeline();
    timeline.push({
      id: Date.now(),
      name: volunteer.name,
      profilePic: volunteer.profilePic || "",
      timestamp: leaveTime.toISOString(),
      hoursVolunteered,
      totalTimeVolunteered: volunteer.totalTimeVolunteered,
    });
    saveTimeline(timeline);

    return queue;
  } finally {
    lockedIds.delete(id);
  }
}
