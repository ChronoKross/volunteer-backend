import { Request, Response } from "express";
import { volunteerEmployee, getQueue } from "../db/queModel";

export function updateQueueController(req: Request, res: Response): void {
  const { id } = req.body;
  

  if (typeof id !== "number") {
    res.status(400).json({ message: "Invalid or missing ID" });
    return;
  }

  const updatedQueue = volunteerEmployee(id);

  if (!updatedQueue) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }

  res.json({
    message: "Employee moved to back of queue.",
    queue: updatedQueue,
  });
}

export function getQueueController(req: Request, res: Response): void {
  const queue = getQueue();
  res.json(queue);
}
