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

// === Shift Time Helpers ===
function getLast7pmTimestamp(): Date {
  const now = new Date();
  const last7pm = new Date(now);
  last7pm.setHours(19, 0, 0, 0);
  if (now < last7pm) last7pm.setDate(last7pm.getDate() - 1);
  return last7pm;
}

function lengthOfShiftInHours(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  const hours = ms / 3600000;
  return Math.max(0, Math.min(12, Math.round(hours * 100) / 100));
}
//needs to be fixed;
// function isDuringNightShift(date: Date): boolean {
//   const hour = date.getHours();
//   const minute = date.getMinutes();
//   const decimal = hour + minute / 60;
//   return decimal < 7 || decimal >= 19;
// }

// === Core Volunteer Logic ===
export function volunteerEmployee(id: number): Employee[] | null {
  if (lockedIds.has(id)) {
    console.warn(`Race blocked: ID ${id} is already being updated`);
    return null;
  }

  () => console.log("volunteerEmployee called");
  console.log("volunteerEmployee called")

  lockedIds.add(id);

  try {
    const queue = getQueue();
    const index = queue.findIndex((emp) => emp.id === id);
    if (index === -1) return null;

    const [volunteer] = queue.splice(index, 1);
    const leaveTime = new Date();

    // if (isDuringNightShift(leaveTime)) {
    //   console.warn(`Blocked: Employee ID ${id} attempted to leave during night shift.`);
    //   return null;
    // }

    const shiftStart = getLast7pmTimestamp();
    const hoursVolunteered = 12 - lengthOfShiftInHours(shiftStart, leaveTime);
    console.log(hoursVolunteered)

    volunteer.lastVolunteeredOn = leaveTime.toISOString();
    volunteer.wentHome = (volunteer.wentHome || 0) + 1;
    volunteer.totalTimeVolunteered = (volunteer.totalTimeVolunteered || 0) + hoursVolunteered;

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
