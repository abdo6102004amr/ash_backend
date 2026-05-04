import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerName: String,
  email: String,
  phone: String,

  items: [
    {
      productId: String,
      name: String,
      size: String,
      quantity: Number,
      price: Number,
    }
  ],

  totalPrice: Number,

  paymentScreenshot: String,

  status: {
    type: String,
    default: "Pending"
  }

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);