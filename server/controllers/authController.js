const User=require("../models/User");
const jwt=require("jsonwebtoken");


exports.register=async(req,res)=>{
    try{
        const{name,email,password}=req.body;
        const userExist=await User.findOne({email});
        if (userExist)
            return res.status(400).json({meassage:"user exists already"});
        const user=new User({name,email,password});
        await user.save();
        res.status(201).json({message:"user added"});

    }catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.login=async(req,res)=>{
    try{
        const{email,password}=req.body;
        const user=await User.findOne({email});
        if(!user){
            res.status(400).json({message:"Invalid credential"});
        }
        const isMatch=await user.comparePassword(password);
        if(!isMatch){
            res.status(400).json({message:"Invalid credential"});
        }
        const token=jwt.sign(
            {id:user._id,role:user.role},
            process.env.JWT_SECRET,
            {expiresIn:"1d"}
        );
        res.status(201).json({message:"login successful",token});

    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}
