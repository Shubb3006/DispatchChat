import { Router } from "express";
import { check, login, logout, signup } from "../controllers/auth.controller.js";
import { customerLogin } from "../controllers/portal.controller.js";
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = Router();

router.post("/login",login);
router.post("/customer-login", customerLogin);
router.post("/signup",signup);

router.post("/logout", logout);

router.get("/check", protectedRoute, check);


export default router;