const express = require('express');
const router = express.Router();

const {getDailyTasks,completeTask} = require('../controllers/dailyTaskController');

const verifyToken = require("../middleware/authMiddleware");

router.post("/complete/:taskId", verifyToken, completeTask);
router.get('/', verifyToken, getDailyTasks);



module.exports = router;