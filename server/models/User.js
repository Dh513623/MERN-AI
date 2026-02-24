const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');

const userSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true,
            trim:true,
            unique:true,
            lowercase:true
        },
        password:{
            type:String,
            required:true,
            minlength:6
        },
        profileImage:{
            type:String,
            default:""
        }  
    },
    {timestamps:true} 
);

userSchema.pre("save",async function(){
    if(!this.isModified("password")) return next();
    try{
        const salt=await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password,salt);
        console.log("Password hashed successfully");   
    }catch(err){
        console.log(err);
    }
});

userSchema.methods.comparePassword= async function(plainPassword){
    return bcrypt.compare(plainPassword,this.password);
} 

module.exports=mongoose.model("User",userSchema);