const express = require("express");
const router = express.Router();

const { getVocabulary  ,  submitVocabularyTest} = require("../controllers/vocabController");

// ✅ Do NOT call the function
router.post("/daily/:userId", getVocabulary);
router.post("/submit", submitVocabularyTest);

module.exports = router;