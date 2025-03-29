import * as express from "express";
import { Request, Response } from "express";
import { enhanceReview } from "../controllers/ai_controller";

const router = express.Router();

router.post("/enhance", (req: Request, res: Response) => {
  enhanceReview(req, res);
});

export default router;