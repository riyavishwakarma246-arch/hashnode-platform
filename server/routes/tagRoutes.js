const express = require("express");
const router = express.Router();

const Tag = require("../models/Tag");
const authMiddleware = require("../middleware/authMiddleware");

// GET ALL TAGS
router.get("/", async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });

    res.json(tags);
  } catch (error) {
    console.error("GET TAGS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch tags",
      error: error.message,
    });
  }
});

// CREATE TAG
router.post("/", authMiddleware, async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        message: "Tag name is required",
      });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existingTag = await Tag.findOne({
      slug,
    });

    if (existingTag) {
      return res.json(existingTag);
    }

    const tag = new Tag({
      name,
      slug,
    });

    const savedTag = await tag.save();

    res.status(201).json(savedTag);
  } catch (error) {
    console.error("CREATE TAG ERROR:", error);

    res.status(500).json({
      message: "Failed to create tag",
      error: error.message,
    });
  }
});

module.exports = router;