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
        level:{
            type:String,
            enum:["Beginner","Intermediate","Advanced"],
            default:"Beginner"
        },
        dailyStreak:{
            type:Number,
            default:0
        },
        maxStreak: {
            type: Number,
            default: 0
        },
        lastActiveDate:{
            type:Date
        },
        grammarScore:{
            type:Number,
            default:0
        },
        fluencyScore:{
            type:Number,
            default:0
        },
        speakingScore:{
            type:Number,
            default:0
        },
        pronunciationScore:{
            type:Number,
            default:0
        },
        vocabularyScore: {
        type: Number,
         default: 0
        },
        profileImage:{
            type:String,
            default:""
        } 
    },
    {timestamps:true} 
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Password hashed successfully");
  } catch (err) {
    console.log(err);
    return next(err); // ✅ pass error
  }

  next(); // ✅ move to next middleware
});
userSchema.methods.comparePassword= async function(plainPassword){
    return bcrypt.compare(plainPassword,this.password);
} 

module.exports=mongoose.model("User",userSchema);