import express from "express";
import db from "../config/db.js";
import upload from "../middlewares/upload.js";
import supabase from "../config/supabase.js";

const router = express.Router();

/* ================= GET ALL PRODUCTS ================= */
router.get("/", async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    const formatted = result.map((p) => {
      try {
        p.sizes =
          typeof p.sizes === "string"
            ? JSON.parse(p.sizes)
            : p.sizes || [];
      } catch {
        p.sizes = [];
      }

      try {
        p.gallery =
          typeof p.gallery === "string"
            ? JSON.parse(p.gallery)
            : p.gallery || [];
      } catch {
        p.gallery = [];
      }

      try {
        p.tags =
          typeof p.tags === "string"
            ? JSON.parse(p.tags)
            : p.tags || [];
      } catch {
        p.tags = [];
      }

      return p;
    });

    res.json(formatted);

  } catch (err) {
    res.status(500).json(err);
  }
});

/* ================= ADD PRODUCT ================= */
router.post(
  "/",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { name, description, sizes, tags } = req.body;

      /* ========= COVER ========= */
      let coverUrl = "";

      if (req.files["cover"]) {
        const file = req.files["cover"][0];
        const fileName = `cover-${Date.now()}-${file.originalname}`;

        const { error } = await supabase.storage
          .from("ASH")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        coverUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/ASH/${fileName}`;
      }

      /* ========= GALLERY ========= */
      let galleryUrls = [];

      if (req.files["gallery"]) {
        for (const file of req.files["gallery"]) {
          const fileName = `gallery-${Date.now()}-${file.originalname}`;

          const { error } = await supabase.storage
            .from("ASH")
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
            });

          if (error) throw error;

          const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/ASH/${fileName}`;
          galleryUrls.push(url);
        }
      }

      /* ========= PARSE ========= */
      let parsedSizes;
      try {
        parsedSizes =
          typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      } catch {
        parsedSizes = [];
      }

      let parsedTags;
      try {
        parsedTags =
          typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = [];
      }

      /* ========= INSERT ========= */
      const sql = `
        INSERT INTO products 
        (name, description, coverImage, gallery, sizes, tags)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await db.query(sql, [
        name,
        description,
        coverUrl,
        JSON.stringify(galleryUrls),
        JSON.stringify(parsedSizes),
        JSON.stringify(parsedTags),
      ]);

      res.json({ message: "Product added ✅" });

    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }
);

/* ================= UPDATE PRODUCT ================= */
router.put(
  "/:id",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, sizes, tags } = req.body;

      let coverUrl = null;
      let galleryUrls = null;

      /* ========= COVER ========= */
      if (req.files["cover"]) {
        const file = req.files["cover"][0];
        const fileName = `cover-${Date.now()}-${file.originalname}`;

        const { error } = await supabase.storage
          .from("ASH")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw error;

        coverUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/ASH/${fileName}`;
      }

      /* ========= GALLERY ========= */
      if (req.files["gallery"]) {
        galleryUrls = [];

        for (const file of req.files["gallery"]) {
          const fileName = `gallery-${Date.now()}-${file.originalname}`;

          const { error } = await supabase.storage
            .from("ASH")
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
            });

          if (error) throw error;

          const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/ASH/${fileName}`;
          galleryUrls.push(url);
        }
      }

      /* ========= PARSE ========= */
      let parsedSizes;
      try {
        parsedSizes =
          typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      } catch {
        parsedSizes = [];
      }

      let parsedTags;
      try {
        parsedTags =
          typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = [];
      }

      /* ========= UPDATE ========= */
      let sql = `
        UPDATE products
        SET name=?, description=?, sizes=?, tags=?
      `;

      let values = [
        name,
        description,
        JSON.stringify(parsedSizes),
        JSON.stringify(parsedTags),
      ];

      if (coverUrl) {
        sql += `, coverImage=?`;
        values.push(coverUrl);
      }

      if (galleryUrls) {
        sql += `, gallery=?`;
        values.push(JSON.stringify(galleryUrls));
      }

      sql += ` WHERE id=?`;
      values.push(id);

      await db.query(sql, values);

      res.json({ message: "Updated ✅" });

    } catch (err) {
      res.status(500).json(err);
    }
  }
);

/* ================= DELETE PRODUCT ================= */
router.delete("/:id", async (req, res) => {
  try {
    await db.query(
      "DELETE FROM products WHERE id=?",
      [req.params.id]
    );

    res.json({ message: "Deleted ✅" });

  } catch (err) {
    res.status(500).json(err);
  }
});

/* ================= GET SINGLE PRODUCT ================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "SELECT * FROM products WHERE id=?",
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    let product = result[0];

    try {
      product.sizes =
        typeof product.sizes === "string"
          ? JSON.parse(product.sizes)
          : product.sizes || [];
    } catch {
      product.sizes = [];
    }

    try {
      product.gallery =
        typeof product.gallery === "string"
          ? JSON.parse(product.gallery)
          : product.gallery || [];
    } catch {
      product.gallery = [];
    }

    try {
      product.tags =
        typeof product.tags === "string"
          ? JSON.parse(product.tags)
          : product.tags || [];
    } catch {
      product.tags = [];
    }

    res.json(product);

  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;