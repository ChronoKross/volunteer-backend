import { Request, Response } from "express"
import fs from "fs"
import path from "path"
import { TimelineEntry } from "../types/types"

const timelinePath = path.join(__dirname, "../db/timeline.json")

export function getTimelineController(req: Request, res: Response): void {
  try {
    const raw = fs.readFileSync(timelinePath, "utf-8")
    const timeline: TimelineEntry[] = JSON.parse(raw)

    // Optional: latest entries first
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    res.json(timeline)
  } catch (err) {
    console.error("Failed to read timeline:", err)
    res.status(500).json({ error: "Failed to read timeline" })
  }
}
