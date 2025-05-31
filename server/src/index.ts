import express, { Request, Response, NextFunction } from "express";
import { Logtail } from "@logtail/node";
import cors from "cors";
import { config } from "./config";
import userRoutes from "./routes/user";

const app = express();
const logtail = new Logtail(config.logtailToken);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logtail.info("Incoming request", {
    method: req.method,
    path: req.path,
    body: req.body,
  });
  next();
});

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the API" });
});

// User routes
app.use("/api/users", userRoutes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logtail.error("Error occurred", {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
