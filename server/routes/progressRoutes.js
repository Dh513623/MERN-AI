const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progressController");

router.get("/report/:userId", progressController.getFullReport);
router.get("/report/download/:userId", progressController.downloadReport);

module.exports = router;