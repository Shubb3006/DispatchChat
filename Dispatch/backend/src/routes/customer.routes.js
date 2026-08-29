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

import { provisionCustomerUser } from "../controllers/portal.controller.js";

const router = express.Router();

// Provision a portal login for a customer company (accounts are
// admin-provisioned — the portal has no self-serve signup).
router.post(
    "/:id/portal-user",
    protectedRoute,
    authorize("admin", "dispatcher", "super_admin"),
    provisionCustomerUser
);

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