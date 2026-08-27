import express from "express";

import {
    createCustomer,
    getCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer
} from "../controllers/customer.controller.js";

import { protectedRoute } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.post("/",protectedRoute,authorize("admin","dispatcher","super_admin"),createCustomer);

router.get("/",protectedRoute,getCustomers);

router.get("/:id",protectedRoute,getCustomer);

router.put(
    "/:id",
    protectedRoute,
    authorize("admin","dispatcher","super_admin"),
    updateCustomer
);

router.delete(
    "/:id",
    protectedRoute,
    authorize("admin","super_admin"),
    deleteCustomer
);

export default router;