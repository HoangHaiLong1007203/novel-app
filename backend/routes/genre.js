import { Router } from "express";
import { getGenres, adminGetGenres, createGenre, updateGenre, deleteGenre } from "../controllers/genreController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireAdmin from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", getGenres);
router.get("/admin", authMiddleware, requireAdmin, adminGetGenres);
router.post("/", authMiddleware, requireAdmin, createGenre);
router.put("/:genreId", authMiddleware, requireAdmin, updateGenre);
router.delete("/:genreId", authMiddleware, requireAdmin, deleteGenre);

export default router;
