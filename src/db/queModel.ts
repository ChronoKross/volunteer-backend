import fs from "fs";
import path from "path";
import { Employee } from "../types/types";


const filePath = path.join(__dirname, "queue.json");
const lockedIds = new Set<number>();

export function getQueue(): Employee[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw).sort((a:Employee, b:Employee) => a.position - b.position);
}

export function saveQueue(queue: Employee[]) {
  fs.writeFileSync(filePath, JSON.stringify(queue, null, 2));
}

// export function updateEmployee(id: number, data: Partial<Employee>): Employee | null {
//   const queue = getQueue();
//   const index = queue.findIndex(emp => emp.id === id);
//   if (index === -1) return null;

//   queue[index] = { ...queue[index], ...data };
//   saveQueue(queue);
//   return queue[index];
// }
export function volunteerEmployee(id: number): Employee[] | null {
  if (lockedIds.has(id)) {
    console.warn(`Race blocked: ID ${id} is already being updated`);
    return null; // or throw an error / return a specific response
  }

  lockedIds.add(id);

  try {
    const queue = getQueue();
    const index = queue.findIndex(emp => emp.id === id);
    if (index === -1) return null;

    const [volunteer] = queue.splice(index, 1);
    const now = new Date().toISOString();
    volunteer.lastVolunteeredOn = now;
    volunteer.wentHome++;

    queue.push(volunteer);
    queue.forEach((emp, idx) => {
      emp.position = idx + 1;
    });

    saveQueue(queue);
    return queue;
  } finally {
    // Always unlock — even if there's an error
    lockedIds.delete(id);
  }
}


// Add more pure data functions as needed (findEmployeeById, removeEmployee, resetQueue, etc)
