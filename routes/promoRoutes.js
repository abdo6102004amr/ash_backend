import express from "express";
import {
  createPromo,
  getAllPromos,
  deletePromo,
  applyPromo
} from "../controllers/promoController.js";

const router = express.Router();

router.post("/", createPromo);
router.get("/", getAllPromos);
router.delete("/:id", deletePromo);
router.post("/apply", applyPromo);

export default router;