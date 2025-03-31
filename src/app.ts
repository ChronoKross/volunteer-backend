import express from "express";
import cors from "cors";
import queueRouter from "./routes/queueRouter";
const allowedOrigins = [
  "http://localhost:5173",
  "https://volunteer-frontend.onrender.com"
];


const app = express();

app.use(cors({
origin: allowedOrigins
}));
app.use(express.json());

// Mount route
app.use("/api/queue", queueRouter);

export default app;
