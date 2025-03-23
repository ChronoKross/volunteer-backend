import fs from "fs";
import path from "path";
import { Employee } from "../types/types";

const filePath = path.join(__dirname, "../db/queue.json");

export function getQueue(): Employee[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw).sort(
    (a: Employee, b: Employee) => a.position - b.position
  );
}

export function saveQueue(queue: Employee[]) {
  fs.writeFileSync(filePath, JSON.stringify(queue, null, 2));
}
