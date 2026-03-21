const express=require('express');
const router=express.Router();
const verifyToken=require('../middleware/authMiddleware');
const {getTodayPlan}=require('../controllers/adaptiveController');

router.get("/today-plan",verifyToken,getTodayPlan);

module.exports=router;