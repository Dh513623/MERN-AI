const express = require("express");
const multer = require("multer");

const {
 getPronunciationSentences,
 evaluatePronunciation
} = require("../controllers/pronunciationController");

const router = express.Router();

const upload = multer({dest:"uploads/"});

router.get("/sentences/:userId",getPronunciationSentences);

router.post("/analyze",upload.single("audio"),evaluatePronunciation);

module.exports = router;