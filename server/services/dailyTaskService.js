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
  const fluency = await FluencySentence.aggregate([{ $sample: { size: 1 } }]);
  const grammar = await GrammarExercise.aggregate([{ $sample: { size: 1 } }]);
  const pronunciation = await Pronunciation.aggregate([{ $sample: { size: 1 } }]);
  const vocabulary = await Vocabulary.aggregate([{ $sample: { size: 1 } }]);

  const tasksArray = [
    { type: "speaking", taskId: speaking[0]?._id || null, adaptiveTasks: [] },
    { type: "fluency", taskId: fluency[0]?._id || null, adaptiveTasks: [] },
    { type: "grammar", taskId: grammar[0]?._id || null, adaptiveTasks: [] },
    { type: "pronunciation", taskId: pronunciation[0]?._id || null, adaptiveTasks: [] },
    { type: "vocabulary", taskId: vocabulary[0]?._id || null, adaptiveTasks: [] },
  ];

  // ✅ Replace weakSkill with adaptive tasks
  const weakIndex = tasksArray.findIndex(t => t.type === weakSkill);
  if (weakIndex !== -1) {
    tasksArray[weakIndex] = {
      type: weakSkill,
      taskId: null,
      adaptiveTasks: todayPlan
    };
  }

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