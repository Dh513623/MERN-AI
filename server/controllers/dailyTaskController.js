const { createDailyTaskForUser } = require("../services/dailyTaskService");

const Score = require("../models/Score");
const DailyTask = require("../models/DailyTask");
const SpeakingTopic = require("../models/SpeakingTopic");
const FluencySentence = require("../models/FluencySentence");
const GrammarExercise = require("../models/grammarSchema");
const Pronunciation = require("../models/PronounciationSchema");
const Vocabulary = require("../models/VocabularySchema");

exports.getDailyTasks = async (req, res) => {
  try {
    const daily = await createDailyTaskForUser(req.user.id);

    const data = daily.toObject();

    data.tasks = await Promise.all(
      data.tasks.map(async (task) => {
        if (task.type === "speaking") {
          task.exercise = await SpeakingTopic.findById(task.taskId);
        }

        if (task.type === "fluency") {
          return task;
        }

        if (task.type === "grammar") {
          task.exercise = task.exercise || { ...task, isPlaceholder: true };
          return task;
        }

        if (task.type === "pronunciation") {
          task.exercise = await Pronunciation.findById(task.taskId);

          const lastScore = await Score.findOne({
            userId: req.user.id,
            exercise_type: "pronunciation",
            source: "daily",
          }).sort({ createdAt: -1 });

          task.lastScore = lastScore?.score || 0;
          return task;
        }

        if (task.type === "vocabulary") {
  const easy = await Vocabulary.aggregate([
    { $match: { difficulty: "easy" } },
    { $sample: { size: 1 } },
  ]);

  const medium = await Vocabulary.aggregate([
    { $match: { difficulty: "medium" } },
    { $sample: { size: 1 } },
  ]);

  const hard = await Vocabulary.aggregate([
    { $match: { difficulty: "hard" } },
    { $sample: { size: 1 } },
  ]);

  task.exercise = {
    easy: easy[0]?.word,
    medium: medium[0]?.word,
    hard: hard[0]?.word,
  };
}

        return task;
      }),
    );

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    const today = new Date().toISOString().split("T")[0];

    const daily = await DailyTask.findOne({
      userId,
      "tasks._id": taskId,
    });
    if (!daily) {
      return res.status(404).json({ message: "No tasks found for today" });
    }

    const task = daily.tasks.id(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.completed) {
      return res.status(400).json({ message: "Task already completed" });
    }

    task.completed = true;

    await daily.save();

    await Score.create({
      userId,
      exercise_type: task.type,
      score: 1,
    });

    return res.json({
      message: "Task marked as completed",
      task,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
