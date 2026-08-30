import {Router} from "express";
import {
    createUser,
    deleteUser,
    getUsers,
    getSavedFilters,
    createSavedFilter,
    deleteSavedFilter,
} from "../controllers/user.contollers.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";






const router = Router();

// Saved list filters (owner-scoped)
router.get("/saved-filters",protectedRoute,getSavedFilters);
router.post("/saved-filters",protectedRoute,createSavedFilter);
router.delete("/saved-filters/:id",protectedRoute,deleteSavedFilter);

router.post("/create",protectedRoute,createUser);
router.get("/",protectedRoute,getUsers)
router.delete("/:id",protectedRoute,authorize("admin", "super_admin"),deleteUser)



export default router;
