const express = require("express");
const router = express.Router();

const {
  getDailyGrammarTest,
  submitDailyGrammarTest
} = require("../controllers/grammarController");

router.get("/daily-test", getDailyGrammarTest);
router.post("/daily-submit", submitDailyGrammarTest);

module.exports = router ;