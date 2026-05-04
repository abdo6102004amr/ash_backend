import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/products",
});

/* ================= GET ALL ================= */
export const getProducts = async () => {
  try {
    const res = await API.get("/");
    return res.data;
  } catch (err) {
    console.error("Error fetching products:", err);
    throw err;
  }
};

/* ================= GET ONE ================= */
export const getProductById = async (id) => {
  try {
    const res = await API.get(`/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching product:", err);
    throw err;
  }
};

/* ================= ADD ================= */
export const createProduct = async (formData) => {
  try {
    const res = await API.post("/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error creating product:", err);
    throw err;
  }
};

/* ================= UPDATE ================= */
export const updateProduct = async (id, formData) => {
  try {
    const res = await API.put(`/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error updating product:", err);
    throw err;
  }
};

/* ================= DELETE ================= */
export const deleteProduct = async (id) => {
  try {
    const res = await API.delete(`/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error deleting product:", err);
    throw err;
  }
};

export default API;