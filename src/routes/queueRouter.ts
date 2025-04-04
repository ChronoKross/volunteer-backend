import express from "express";
import { getQueueController, updateQueueController } from "../controllers/queueController";
import { getTimelineController } from "../controllers/timelineController"


const queueRouter = express.Router();

queueRouter.get("/", getQueueController);

queueRouter.post("/volunteer", updateQueueController);
queueRouter.get("/timeline", getTimelineController) 

export default queueRouter;
