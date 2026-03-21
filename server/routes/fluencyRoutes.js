const express=require('express');
const router=express.Router();
const verifyToken=require('../middleware/authMiddleware');
const {fluencyEvaluate}=require('../controllers/fluencyController');

router.post("/",verifyToken,fluencyEvaluate);

module.exports=router;