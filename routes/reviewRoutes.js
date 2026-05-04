import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* ================= ADD ================= */
router.post("/", async (req, res) => {
  try {
    const { product_id, name, rating, comment } = req.body;

    console.log("BODY:", req.body);

    if (!product_id || !name || !rating) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const sql = `
      INSERT INTO reviews (product_id, name, rating, comment)
      VALUES (?, ?, ?, ?)
    `;

    await db.query(sql, [
      product_id,
      name,
      rating,
      comment || null,
    ]);

    res.json({ message: "Review added ✅" });

  } catch (err) {
    console.log("SQL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= GET ALL ================= */
router.get("/", async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT * FROM reviews ORDER BY id DESC"
    );

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= GET BY PRODUCT ================= */
router.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT * FROM reviews
      WHERE product_id = ?
      ORDER BY id DESC
    `;

    const [result] = await db.query(sql, [id]);

    res.json(result);

  } catch (err) {
    console.log("SQL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE ================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = "DELETE FROM reviews WHERE id = ?";

    await db.query(sql, [id]);

    res.json({ message: "Review deleted 🗑️" });

  } catch (err) {
    console.log("SQL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;