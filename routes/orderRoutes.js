import express from "express";
import db from "../config/db.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

/* ================= CREATE ORDER ================= */
router.post("/", upload.single("screenshot"), async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      address,
      totalPrice,
      items,
      promoCode,     // 🔥 جديد
      discount,      // 🔥 جديد
      promoType,
      paymentMethod,
      paymentImage,
    } = req.body;

    const uploadedFile = req.file?.filename;
    const finalImage = uploadedFile || paymentImage || null;

    const orderSql = `
      INSERT INTO orders 
      (customerName, email, phone, address, totalPrice, paymentScreenshot, status, payment_method, promoCode, discount, promoType)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(orderSql, [
      customerName,
      email,
      phone,
      address,
      totalPrice,
      finalImage,
      "pending",
      paymentMethod || "cash",
      promoCode || null,
      discount || 0,
      promoType || null
    ]);

    const orderId = result.insertId;

    let itemsArray = [];
    try {
      itemsArray =
        typeof items === "string" ? JSON.parse(items) : items;
    } catch {
      itemsArray = [];
    }

    if (!itemsArray || itemsArray.length === 0) {
      return res.json({
        message: "Order created (no items) ✅",
        orderId,
      });
    }

    const itemSql = `
      INSERT INTO order_items 
      (order_id, product_name, size, quantity, price)
      VALUES ?
    `;

    const values = itemsArray.map((item) => [
      orderId,
      item.name,
      item.size || item.selectedSize,
      item.quantity,
      item.price,
    ]);

    await db.query(itemSql, [values]);

    res.json({
      message: "Order created ✅",
      orderId,
    });

  } catch (err) {
    console.log("ORDER ERROR:", err);
    res.status(500).json(err);
  }
});

/* ================= GET ORDERS ================= */
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT 
        o.*, 
        oi.product_name,
        oi.size,
        oi.quantity,
        oi.price
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ORDER BY o.id DESC
    `;

    const [rows] = await db.query(sql);

    const ordersMap = {};

    rows.forEach((row) => {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          customerName: row.customerName,
          email: row.email,
          phone: row.phone,
          address: row.address,
          totalPrice: row.totalPrice,
          promoCode: row.promoCode,
          discount: row.discount,
          promoType: row.promoType,
          paymentScreenshot: row.paymentScreenshot,
          payment_method: row.payment_method,
          status: row.status,
          items: [],
        };
      }

      if (row.product_name) {
        ordersMap[row.id].items.push({
          name: row.product_name,
          size: row.size,
          quantity: row.quantity,
          price: row.price,
        });
      }
    });

    res.json(Object.values(ordersMap));

  } catch (err) {
    res.status(500).json(err);
  }
});

/* ================= UPDATE STATUS ================= */
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (status === "Done") {
      await db.query(
        "UPDATE orders SET status=?, done_at=NOW() WHERE id=?",
        [status, req.params.id]
      );
    } else {
      await db.query(
        "UPDATE orders SET status=? WHERE id=?",
        [status, req.params.id]
      );
    }

    res.json({ message: "Status updated ✅" });

  } catch (err) {
    res.status(500).json(err);
  }
});

/* ================= DELETE ORDER ================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM order_items WHERE order_id = ?", [id]);
    await db.query("DELETE FROM orders WHERE id = ?", [id]);

    res.json({ message: "Order deleted 🗑️" });

  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;