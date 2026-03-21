const express=require('express');
const router=express.Router();
const verifyToken=require('../middleware/authMiddleware');
const {speakingEvaluate}=require('../controllers/speakingController');

router.post("/",verifyToken,speakingEvaluate);

module.exports=router;