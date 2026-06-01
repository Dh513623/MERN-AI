const DailyTask = require('../models/DailyTask');
const SpeakingTopic = require('../models/SpeakingTopic');
const FluencySentence = require('../models/FluencySentence');
const GrammarExercise = require("../models/grammarSchema");
const Pronunciation = require("../models/PronounciationSchema");
const Vocabulary = require("../models/VocabularySchema");
const { generateTodayPlan } = require("./adaptiveService");

/**
 * Create or return DailyTask for a given userId
 */
async function createDailyTaskForUser(userId) {
  const today = new Date().toISOString().split("T")[0];

  // ✅ Check if already exists
  let existing = await DailyTask.findOne({ userId, date: today });
  if (existing) return existing;

  // ✅ Generate adaptive plan
  const planData = await generateTodayPlan(userId);
  const weakSkill = planData.weak_area;
  const todayPlan = planData.today_plan || [];

  // ✅ Random tasks for other modules
  const speaking = await SpeakingTopic.aggregate([{ $sample: { size: 1 } }]);
  

const starter = await FluencySentence.find({ type: "starter" }).limit(1);
const simple = await FluencySentence.find({
  type: { $in: ["simple", "normal"] }
}).limit(2);
const repetition = await FluencySentence.find({ type: "repetition" }).limit(1);
console.log("starter:", starter);
console.log("simple:", simple);
console.log("repetition:", repetition);
const fluencyExercise = {
  title: starter[0]?.text || "Fluency Practice",
  starter: starter[0]?.text || "",
  sentences: [
    ...(simple.map(s => s.text)),
    repetition[0]?.text || ""
  ],
  instruction: "Combine into a smooth paragraph."
};
  const grammarQuestions = await GrammarExercise.aggregate([
  { $match: { module: "grammar" } },
  { $sample: { size: 15 } }
]);

const grammarTask = {
  type: "grammar",
  taskId: "daily-grammar",
  completed: false,
  exercise: {
    questions: grammarQuestions
  }
};
  const pronunciation = await Pronunciation.aggregate([{ $sample: { size: 1 } }]);
  const vocabulary = await Vocabulary.aggregate([{ $sample: { size: 1 } }]);

  const tasksArray = [
  {
    type: "speaking",
    taskId: speaking[0]?._id,
    completed: false
  },
 {
  type: "fluency",
  taskId: starter[0]?._id || null,
  exercise: fluencyExercise,
  completed: false
},
  grammarTask,
  {
    type: "pronunciation",
    taskId: pronunciation[0]?._id,
    completed: false
  },
  {
    type: "vocabulary",
    taskId: vocabulary[0]?._id,
    completed: false
  }
];

  // ✅ Replace weakSkill with adaptive tasks
 const weakIndex = tasksArray.findIndex(
  t => t.type.toLowerCase() === weakSkill?.toLowerCase()
);

if (weakIndex !== -1) {
  tasksArray[weakIndex] = {
    ...tasksArray[weakIndex],
    adaptiveTasks: todayPlan,
    completed: false
  };
}

console.log("weakSkill:", weakSkill);
console.log("weakIndex:", weakIndex);
console.log("todayPlan:", todayPlan);

  // ✅ Save
  const newTasks = await DailyTask.create({
    userId,
    date: today,
    weakSkill,
    tasks: tasksArray
  });

  return newTasks;
}

module.exports = { createDailyTaskForUser };