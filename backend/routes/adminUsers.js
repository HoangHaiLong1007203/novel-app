import { Router } from "express";
import { getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from "../controllers/adminUserController.js";

const router = Router();

router.get("/", getAdminUsers);
router.patch("/:userId/role", updateAdminUserRole);
router.patch("/:userId/status", updateAdminUserStatus);

export default router;
