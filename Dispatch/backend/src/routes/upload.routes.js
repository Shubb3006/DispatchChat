import {Router} from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { uploadDocument, getDocumentsForLoad } from "../controllers/upload.controller.js";
import { upload } from "../config/multer.js";





const router = Router();

router.get("/load/:load_number",protectedRoute,getDocumentsForLoad);
router.post("/:load_number",protectedRoute,upload.single("file"),uploadDocument);



export default router;
