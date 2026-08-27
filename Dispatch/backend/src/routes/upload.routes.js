import {Router} from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { uploadDocument } from "../controllers/upload.controller.js";
import { upload } from "../config/multer.js";





const router = Router();

router.post("/:load_number",protectedRoute,upload.single("file"),uploadDocument);



export default router;