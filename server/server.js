const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const postRoutes = require("./routes/posts");
const authRoutes = require("./routes/auth");
const tagRoutes =require("./routes/tagRoutes");

app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tags",tagRoutes);

app.get("/", (req, res) => {
  res.send("Hashnode Platform API is running");
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });