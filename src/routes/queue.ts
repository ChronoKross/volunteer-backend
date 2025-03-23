import express from "express";
import { getQueue, saveQueue } from "../controllers/queueController";

const queueRouter = express.Router();

queueRouter.get("/", (req, res) => {
  const queue = getQueue();
  res.json(queue);
});

queueRouter.post("/volunteer", (req, res) => {
  const updated = getQueue(); // eventually handled in controller
  res.json(updated);
});

export default queueRouter;
