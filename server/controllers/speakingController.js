//const FluencySentence=require('../models/FluencySentence');
const Score=require('../models/Score');
const {evaluateSpeaking}=require('../services/speakingAiService');
const User=require('../models/User');
const SpeakingTopic = require('../models/SpeakingTopic');

exports.speakingEvaluate=async(req,res)=>{
    const {mode,topicId,userAnswer}=req.body;

    try{
        const user=await User.findById(req.user.id);
        if(!user){
            return res.json("invalid user");
        }
        if(mode==='generate'){
            const difficultyMap={
                Beginner:"easy",
                Intermediate:"medium",
                Advanced:"hard"
            };
            const difficulty=difficultyMap[user.level];
            const attempted = await Score.find({
                userId: user._id,
                exercise_type: "speaking",
            }).select("topicId");

            const attemptedIds=attempted.map((item)=>item.topicId);

            const topic=await SpeakingTopic.findOne({
                difficulty:difficulty,
                _id:{$nin:attemptedIds},
            });
             if (!topic) {
                return res.json({
                    message: "🎉 You have completed all topics in this level!",
                });
            }
            return res.json({
                topicId: topic._id,
                title: topic.title,
                cuePoints: topic.cuePoints,
                difficulty: topic.difficulty,
            });
        }else if(mode==='evaluate'){
            const aiResult=await evaluateSpeaking(userAnswer);
            const score=new Score({
                userId: req.user.id,
                topicId: topicId,
                exercise_type:'speaking',
                user_input:userAnswer,
                grammarScore:aiResult.grammarScore,
                fluencyScore:aiResult.fluencyScore,
                vocabularyScore:aiResult.vocabularyScore,
                pronunciationScore:aiResult.pronunciationScore,
                overallScore:aiResult.overallScore,
                strengths:aiResult.strengths,
                weaknesses:aiResult.weaknesses,
                improved_version:aiResult.improved_version,
            });
            await score.save();

            const allFluencyScore=await Score.find(
                {
                    userId:req.user.id,
                    exercise_type:'speaking'
                }
            );
            const avg= allFluencyScore.length>0
                 ?allFluencyScore.reduce((sum,item)=>sum+item.overallScore,0)/allFluencyScore.length
                 :0;

            await User.findByIdAndUpdate(req.user.id,{
                speakingScore:Math.round(avg)
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