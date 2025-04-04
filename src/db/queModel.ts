import fs from "fs";
import path from "path";
import { Employee } from "../types/types";

// Define the root project directory and ensure file paths are correct
const rootDir = process.cwd();
const queueFilePath = path.join(rootDir, "db", "queue.json");
const timelineFilePath = path.join(rootDir, "db", "timeline.json");

// Create directories if they don't exist
function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Ensure timeline file exists or create an empty one
function ensureTimelineFileExists() {
  ensureDirectoryExists(timelineFilePath);
  if (!fs.existsSync(timelineFilePath)) {
    fs.writeFileSync(timelineFilePath, JSON.stringify([])); // Create an empty array if file doesn't exist
  }
}

// Get the employee queue from file
export function getQueue(): Employee[] {
  ensureDirectoryExists(queueFilePath); // Ensure the queue file's directory exists
  const raw = fs.readFileSync(queueFilePath, "utf-8");
  return JSON.parse(raw).sort((a: Employee, b: Employee) => a.position - b.position);
}

// Save updated queue to file
export function saveQueue(queue: Employee[]) {
  ensureDirectoryExists(queueFilePath); // Ensure the queue file's directory exists
  fs.writeFileSync(queueFilePath, JSON.stringify(queue, null, 2));
}

// Get timeline data from file
function getTimeline() {
  ensureTimelineFileExists(); // Ensure timeline file exists before reading
  const raw = fs.readFileSync(timelineFilePath, "utf-8");
  return JSON.parse(raw);
}

// Save timeline data to file
function saveTimeline(timeline: any[]) {
  ensureTimelineFileExists(); // Ensure timeline file exists before writing
  fs.writeFileSync(timelineFilePath, JSON.stringify(timeline, null, 2));
}

// Volunteer an employee and update their record
export function volunteerEmployee(id: number): Employee[] | null {
  const lockedIds = new Set<number>();

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

    // Update basic fields
    volunteer.lastVolunteeredOn = leaveTime.toISOString();
    volunteer.wentHome = (volunteer.wentHome || 0) + 1;

    // === Fix shift logic for overnight 7PM–7AM ===
    const shiftStart = new Date(leaveTime);
    const shiftEnd = new Date(leaveTime);

    // If it's before 7AM, shift started the previous day
    if (leaveTime.getHours() < 7) {
      shiftStart.setDate(shiftStart.getDate() - 1);
    }
    shiftStart.setHours(19, 0, 0, 0); // 7:00 PM

    // If it's after 7AM, shift ends tomorrow
    if (leaveTime.getHours() >= 7) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }
    shiftEnd.setHours(7, 0, 0, 0); // 7:00 AM

    // Calculate hours left in shift
    let hoursVolunteered = 0;
    if (leaveTime >= shiftStart && leaveTime <= shiftEnd) {
      const msRemaining = shiftEnd.getTime() - leaveTime.getTime();
      hoursVolunteered = msRemaining / (1000 * 60 * 60);
      hoursVolunteered = Math.max(0, Math.min(12, hoursVolunteered));

      // ✅ Round to 2 decimal places
      hoursVolunteered = Math.round(hoursVolunteered * 100) / 100;
    }

    // Update total volunteered time
    volunteer.totalTimeVolunteered = (volunteer.totalTimeVolunteered || 0) + hoursVolunteered;

    // Re-add to queue and reindex positions
    queue.push(volunteer);
    queue.forEach((emp, idx) => {
      emp.position = idx + 1;
    });

    saveQueue(queue);

    // Add volunteer activity to the timeline
    const timeline = getTimeline();
    timeline.push({
      id: Date.now(),
      name: volunteer.name,
      profilePic: volunteer.profilePic || "",
      timestamp: leaveTime.toISOString(),
      hoursVolunteered: hoursVolunteered, // This shift only
      totalTimeVolunteered: volunteer.totalTimeVolunteered, // Running total
    });

    saveTimeline(timeline);

    return queue;
  } finally {
    lockedIds.delete(id); // Unlock after the operation
  }
}
