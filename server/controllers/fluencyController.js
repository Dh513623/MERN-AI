const FluencySentence=require('../models/FluencySentence');
const Score=require('../models/Score');
const {evaluateFluency}=require('../services/fluencyAiService');
const User=require('../models/User');

exports.fluencyEvaluate=async(req,res)=>{
    const {mode,starter,sentences,userAnswer}=req.body;

    try{
        if(mode==='generate'){
            const starterArr=await FluencySentence.aggregate([
                {$match:{type:'starter'}},
                {$sample:{size:1}}
            ]);
            const simpleArr=await FluencySentence.aggregate([
                {$match:{type:'simple'}},
                {$sample:{size:2}}
            ]);
            const repetitionArr=await FluencySentence.aggregate([
                {$match:{type:'repetition'}},
                {$sample:{size:1}}
            ]);

            const exercise={
                starter:starterArr[0].text,
                sentences:[simpleArr[0].text, simpleArr[1].text, repetitionArr[0].text],
                instruction:"combine,expand,remove repetition and develop a story containing minimum of 7-8lines"
            };
            res.json({exercise,message:"exercise generated successfully!"});
        }else if(mode==='evaluate'){
            const aiResult=await evaluateFluency(userAnswer);
            const score=new Score({
                userId: req.user.id,
                exercise_type:'fluency',
                user_input:userAnswer,
                score:aiResult.score,
                strengths:aiResult.strengths,
                weaknesses:aiResult.weaknesses,
                improved_version:aiResult.improved_version,
            });
            await score.save();

            const allFluencyScore=await Score.find(
                {
                    userId:req.user.id,
                    exercise_type:'fluency'
                }
            );
            const avg= allFluencyScore.length>0
                 ?allFluencyScore.reduce((sum,item)=>sum+item.score,0)/allFluencyScore.length
                 :0;

            await User.findByIdAndUpdate(req.user.id,{
                fluencyScore:Math.round(avg)
            });

            res.status(200).json(aiResult);

        }else{
            return res.status(400).json({message:"invalid mode"});
        }
        

    }catch(err){
        console.log(err);
        res.status(500).json({message:err.message});
    }
}