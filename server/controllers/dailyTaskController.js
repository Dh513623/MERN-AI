const { createDailyTaskForUser } = require("../services/dailyTaskService");
const Score = require("../models/Score");

exports.getDailyTasks = async (req, res) => {
  try {
    const tasks = await createDailyTaskForUser(req.user.id);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.taskId;

    const today = new Date().toISOString().split("T")[0];
    const daily = await DailyTask.findOne({ userId, date: today });

    if (!daily) return res.status(404).json({ message: "No tasks found for today" });

    const task = daily.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.completed = true;
    await daily.save();

    // Update Score
    await Score.create({
      userId,
      exercise_type: task.type,
      score: 1,
      createdAt: new Date(),
    });

    res.json({ message: "Task marked as completed", task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};