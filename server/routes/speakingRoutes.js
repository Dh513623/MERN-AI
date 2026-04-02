const express = require("express");
const router = express.Router();
const multer = require("multer");

const { speakingEvaluate } = require("../controllers/speakingController");
const verifyToken=require('../middleware/authMiddleware');

const upload = multer({ dest: "uploads/" });

// Single route to handle both modes
router.post("/", verifyToken, upload.single("audio"), speakingEvaluate);

module.exports = router;