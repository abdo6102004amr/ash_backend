import db from "../config/db.js";

// ➕ CREATE
export const createPromo = async (req, res) => {
    try {
      const { code } = req.body;
  
      const [exist] = await db.query(
        "SELECT id FROM promo_codes WHERE code = ?",
        [code]
      );
  
      if (exist.length > 0) {
        return res.status(400).json({
          message: "Promo code already exists",
        });
      }
  
      await db.query("INSERT INTO promo_codes SET ?", [req.body]);
  
      res.json({ message: "Promo created successfully" });
  
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  };

// 📥 GET ALL
export const getAllPromos = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM promo_codes ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ❌ DELETE
export const deletePromo = async (req, res) => {
  try {
    await db.query("DELETE FROM promo_codes WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};

// 🔥 APPLY PROMO
export const applyPromo = async (req, res) => {
  const { code, totalAmount, email } = req.body;

  try {
    if (!code) {
      return res.status(400).json({ message: "Promo code required" });
    }

    const [rows] = await db.query(
      "SELECT * FROM promo_codes WHERE code = ?",
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Invalid promo code" });
    }

    const p = rows[0];

    if (!p.active) {
      return res.status(400).json({ message: "Promo not active" });
    }

    const now = new Date();
    if (
      (p.start_date && now < new Date(p.start_date)) ||
      (p.end_date && now > new Date(p.end_date))
    ) {
      return res.status(400).json({ message: "Promo expired" });
    }

    if (p.usage_limit && p.used_count >= p.usage_limit) {
      return res.status(400).json({ message: "Promo limit reached" });
    }

    if (email) {
      const [usedBefore] = await db.query(
        "SELECT id FROM orders WHERE email = ? AND promoCode = ?",
        [email, code]
      );

      if (usedBefore.length > 0) {
        return res.status(400).json({
          message: "You already used this promo code",
        });
      }
    }

    if (totalAmount < p.min_order) {
      return res
        .status(400)
        .json({ message: "Minimum order not reached" });
    }

    let discount = 0;

    switch (p.type) {
      case "percentage":
        discount = (totalAmount * p.discount_value) / 100;
        break;

      case "fixed":
        discount = p.discount_value;
        break;

      case "bogo":
        return res.json({
          type: "bogo",
          buy: p.bundle_buy,
          get: p.bundle_get,
          message: "Buy 1 Get 1 applied 🎁",
        });

      case "bundle":
        return res.json({
          type: "bundle",
          buy: p.bundle_buy,
          get: p.bundle_get,
          message: "Bundle offer applied 🎁",
        });

      default:
        break;
    }

    if (discount > totalAmount) discount = totalAmount;

    const finalPrice = totalAmount - discount;

    res.json({
      type: "discount",
      discount,
      finalPrice,
      message: "Promo applied successfully ✅",
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};