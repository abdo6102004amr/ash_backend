import db from "../config/db.js";

// ➕ CREATE
export const createPromo = async (req, res) => {
  try {
    const { code } = req.body;

    const cleanCode = code.trim().toLowerCase();

    const [exist] = await db.query(
      "SELECT id FROM promo_codes WHERE LOWER(code) = ?",
      [cleanCode]
    );

    if (exist.length > 0) {
      return res.status(400).json({
        message: "Promo code already exists",
      });
    }

    await db.query("INSERT INTO promo_codes SET ?", [
      {
        ...req.body,
        code: cleanCode,
      },
    ]);

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

    await db.query(
      "DELETE FROM promo_codes WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json(err);
  }
};

// 🔥 APPLY PROMO
export const applyPromo = async (req, res) => {

  const {
    code,
    totalAmount,
    email,
    cartItems,
  } = req.body;

  try {

    if (!code) {
      return res.status(400).json({
        message: "Promo code required",
      });
    }

    const cleanCode = code.trim().toLowerCase();

    const [rows] = await db.query(
      "SELECT * FROM promo_codes WHERE LOWER(code) = ?",
      [cleanCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Invalid promo code",
      });
    }

    const p = rows[0];

    // ✅ ACTIVE
    if (!p.active) {
      return res.status(400).json({
        message: "Promo not active",
      });
    }

    // ✅ DATE CHECK
    const now = new Date();

    if (
      (p.start_date && now < new Date(p.start_date)) ||
      (p.end_date && now > new Date(p.end_date))
    ) {
      return res.status(400).json({
        message: "Promo expired",
      });
    }

    // ✅ LIMIT
    if (
      p.usage_limit &&
      p.used_count >= p.usage_limit
    ) {
      return res.status(400).json({
        message: "Promo limit reached",
      });
    }

    // ✅ USED BEFORE
    if (email) {

      const [usedBefore] = await db.query(
        "SELECT id FROM orders WHERE email = ? AND promoCode = ?",
        [email, cleanCode]
      );

      if (usedBefore.length > 0) {
        return res.status(400).json({
          message: "You already used this promo code",
        });
      }
    }

    // ✅ MIN ORDER
    if (totalAmount < p.min_order) {
      return res.status(400).json({
        message: "Minimum order not reached",
      });
    }

    let discount = 0;

    switch (p.type) {

      // =========================
      // PERCENTAGE
      // =========================
      case "percentage":

        discount =
          (totalAmount * p.discount_value) / 100;

        break;

      // =========================
      // FIXED
      // =========================
      case "fixed":

        discount = p.discount_value;

        break;

      // =========================
      // BOGO
      // =========================
      case "bogo":

        if (
          !cartItems ||
          !Array.isArray(cartItems)
        ) {
          return res.status(400).json({
            message: "Cart items required",
          });
        }

        const normalize = (s) =>
          String(s)
            .replace("ml", "")
            .trim();

        const targetItem = cartItems.find(
          (item) =>
            normalize(item.size) ===
            normalize(p.bundle_buy)
        );

        if (!targetItem) {
          return res.status(400).json({
            message: `Add ${p.bundle_buy}ml items to activate promo`,
          });
        }

        const buyQty = p.buy_qty || 1;
        const getQty = p.get_qty || 1;

        const fullGroup =
          buyQty + getQty;

        const eligibleGroups = Math.floor(
          targetItem.quantity / fullGroup
        );

        if (eligibleGroups <= 0) {
          return res.status(400).json({
            message:
              `Buy ${buyQty} Get ${getQty} offer not completed`,
          });
        }

        const freeItems =
          eligibleGroups * getQty;

        discount =
          freeItems * targetItem.price;

        break;

      // =========================
      // BUNDLE
      // =========================
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

    // ✅ MAX DISCOUNT
    if (discount > totalAmount) {
      discount = totalAmount;
    }

    const finalPrice =
      totalAmount - discount;

    res.json({
      type: p.type,
      discount,
      finalPrice,
      promo: p.code,
      message: "Promo applied successfully ✅",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: err.message,
    });
  }
};
