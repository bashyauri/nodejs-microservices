const express = require("express");
const router = express.Router();
const { searchPostController } = require("../controllers/search-controller");
const authenticateRequest = require("../middleware/authMiddleware");
router.use(authenticateRequest);

router.get("/posts", searchPostController);

module.exports = router;
