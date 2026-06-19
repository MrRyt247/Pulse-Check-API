import { Router } from "express";
import type { Request, Response } from "express";

const monitorRoutes = Router();

monitorRoutes.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello from monitors",
  });
});

export default monitorRoutes;
