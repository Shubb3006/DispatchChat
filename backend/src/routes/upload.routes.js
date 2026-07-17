import {Router} from "express";
import { protectedRoute } from "../middlewares/auth.middleware";
import { uploadDocument } from "../controllers/upload.controller";
import { upload } from "../config/multer";





const router = Router();

router.post("/:load_number",protectedRoute,upload.single("file"),uploadDocument);



export default router;