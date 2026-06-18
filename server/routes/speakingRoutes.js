const express = require("express");
const router = express.Router();


const { speakingEvaluate } = require("../controllers/speakingController");
const verifyToken=require('../middleware/authMiddleware');


// Single route to handle both modes
router.post("/", verifyToken, speakingEvaluate);

module.exports = router;
