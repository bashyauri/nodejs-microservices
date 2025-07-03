const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controllers/post-controller");
const authenticateRequest = require("../middleware/authMiddleware");

// Middleware to check authentication

router.use(authenticateRequest);
router.post("/create-post", createPost);
router.get("/", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;
