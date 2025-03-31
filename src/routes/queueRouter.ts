import express from "express";
import { getQueueController, updateQueueController} from "../controllers/queueController";

const queueRouter = express.Router();

queueRouter.get("/", getQueueController);

queueRouter.post("/volunteer", updateQueueController);

export default queueRouter;
