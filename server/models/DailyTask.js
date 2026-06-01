const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["grammar", "speaking", "fluency", "pronunciation", "vocabulary"],
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.Mixed // reference to actual task
  },
  completed: {
    type: Boolean,
    default: false
  },
  exercise: {
    type: mongoose.Schema.Types.Mixed   // ✅ ADD THIS
  },
  adaptiveTasks: [   // store adaptive tasks for weak skill
    {
      task: { type: String },
      count: { type: Number },
      duration: { type: String }
    }
  ]
});

const DailyTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  weakSkill: {  // store today's weak skill
    type: String,
    enum: ["grammar", "speaking", "fluency", "pronunciation", "vocabulary"]
  },
  tasks: [TaskSchema]
}, { timestamps: true });

module.exports = mongoose.model("DailyTask", DailyTaskSchema);