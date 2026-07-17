import {Router} from "express";
import { createUser, deleteUser, getUsers } from "../controllers/user.contollers";
import { protectedRoute } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";






const router = Router();
router.post("/create",protectedRoute,createUser);
router.get("/",getUsers)
router.delete("/:id",protectedRoute,authorize("admin", "super_admin"),deleteUser)



export default router;