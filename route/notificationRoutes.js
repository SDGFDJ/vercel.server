import express from "express";
import Notification from "../models/Notification.js";
import { isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/all", isAdmin, async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });
  res.json({ notifications });
});

export default router;
