import express from "express";
import cors from "cors";
import queueRouter from "./routes/queue";

const app = express();

app.use(cors());
app.use(express.json());

// Mount route
app.use("/api/queue", queueRouter);

export default app;
