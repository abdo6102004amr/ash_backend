import multer from "multer";

const storage = multer.memoryStorage(); // 🔥 مهم جدًا

const upload = multer({ storage });

export default upload;