const express = require("express");
const router = express.Router();

const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Generate a URL-friendly slug from the title
function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 1. GET ALL PUBLISHED POSTS
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({ status: "published" })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (error) {
    console.error("GET POSTS ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
});

// 2. GET MY POSTS — keep before /:id
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.userId })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (error) {
    console.error("MY POSTS ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch your posts",
      error: error.message,
    });
  }
});

// 3. UPLOAD COVER IMAGE
router.post("/upload-cover", authMiddleware, (req, res) => {
  upload.single("coverImage")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || "Image upload failed",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image",
      });
    }

    return res.json({
      message: "Cover image uploaded successfully",
      coverImage: `/uploads/${req.file.filename}`,
    });
  });
});

// 4. GET SINGLE PUBLISHED POST
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      status: "published",
    }).populate("author", "name email");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json(post);
  } catch (error) {
    console.error("GET SINGLE POST ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch post",
      error: error.message,
    });
  }
});

// 5. CREATE POST
router.post("/", authMiddleware, async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();

    if (!title) {
      return res.status(400).json({
        message: "Post title is required",
      });
    }

    const slug = makeSlug(req.body.slug || title);

    if (!slug) {
      return res.status(400).json({
        message: "A valid post title or slug is required",
      });
    }

    const post = new Post({
      title,
      content: req.body.content || "",
      excerpt: req.body.excerpt || "",
      coverImage: req.body.coverImage || "",
      status: req.body.status || "draft",
      slug,
      tags: req.body.tags || [],
      author: req.userId,
    });

    const savedPost = await post.save();
    return res.status(201).json(savedPost);
  } catch (error) {
    console.error("CREATE ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A post with this slug already exists. Try a different title.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Post validation failed",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create post",
      error: error.message,
    });
  }
});

// 6. UPDATE POST
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only edit your own posts",
      });
    }

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();

      if (!title) {
        return res.status(400).json({
          message: "Post title cannot be empty",
        });
      }

      post.title = title;
    }

    if (req.body.content !== undefined) {
      post.content = req.body.content;
    }

    if (req.body.excerpt !== undefined) {
      post.excerpt = req.body.excerpt;
    }

    if (req.body.coverImage !== undefined) {
      post.coverImage = req.body.coverImage;
    }

    if (req.body.status !== undefined) {
      post.status = req.body.status;
    }

    if (req.body.slug !== undefined || req.body.title !== undefined) {
      const newSlug = makeSlug(req.body.slug || post.title);

      if (!newSlug) {
        return res.status(400).json({
          message: "A valid post title or slug is required",
        });
      }

      post.slug = newSlug;
    }

    if (req.body.tags !== undefined) {
      post.tags = req.body.tags;
    }

    const updatedPost = await post.save();
    return res.json(updatedPost);
  } catch (error) {
    console.error("UPDATE ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A post with this slug already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Post validation failed",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update post",
      error: error.message,
    });
  }
});

// 7. DELETE POST
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only delete your own posts",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return res.status(500).json({
      message: "Failed to delete post",
      error: error.message,
    });
  }
});

module.exports = router;