import express from "express";

import {
  createTrailer,
  getTrailers,
  getTrailerById,
  updateTrailer,
  deleteTrailer,
} from "../controllers/trailor.controller.js";
import { authorize } from "../middlewares/role.middleware.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post(
  "/",
  protectedRoute,
  authorize("admin", "dispatcher","super_admin"),
  createTrailer
);

router.get(
  "/",
  protectedRoute,
  getTrailers
);

router.get(
  "/:id",
  protectedRoute,
  getTrailerById
);

router.put(
  "/:id",
  protectedRoute,
  authorize("admin", "dispatcher","super_admin"),
  updateTrailer
);

router.delete(
  "/:id",
  protectedRoute,
  authorize("admin","super_admin"),
  deleteTrailer
);

export default router;