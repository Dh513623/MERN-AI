const express = require('express');
const router = express.Router();

const {getDailyTasks} = require('../controllers/dailyTaskController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getDailyTasks);


module.exports = router;