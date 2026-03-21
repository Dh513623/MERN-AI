const mongoose = require("mongoose");

const dailySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: String,
      required: true
    },
    tasks: [
      {
        type: {
          type: String,
          enum: ["grammar", "speaking", "fluency", "pronunciation"],
          required: true
        },
        taskId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        completed: {
          type: Boolean,
          default: false
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("DailyTask", dailySchema);
