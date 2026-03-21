const DailyTask = require('../models/DailyTask');
const SpeakingTopic = require('../models/SpeakingTopic');
const FluencySentence = require('../models/FluencySentence');

exports.getDailyTasks = async (req,res)=>{

 try{

    const today = new Date().toISOString().split("T")[0];

    let tasks = await DailyTask.findOne({
        userId:req.user.id,
        date:today
    });

    if(tasks){
        return res.json(tasks);
    }

    const speaking = await SpeakingTopic.aggregate([{ $sample:{size:1}}]);
    const fluency = await FluencySentence.aggregate([{ $sample:{size:1}}]);

    const newTasks = new DailyTask({
        userId:req.user.id,
        date:today,
        tasks:[
            {
                type:"speaking",
                taskId:speaking[0]._id
            },
            {
                type:"fluency",
                taskId:fluency[0]._id
            }
        ]
    });

    await newTasks.save();

    res.json(newTasks);

 }catch(err){
    res.status(500).json({message:err.message});
 }

};