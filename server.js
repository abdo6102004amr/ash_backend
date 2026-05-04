import express from "express";
import cors from "cors";

import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ❗ مش محتاج uploads بعد Supabase
// app.use("/uploads", express.static("uploads"));

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});