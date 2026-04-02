const Score = require("../models/Score");
const mongoose = require("mongoose");

const getProgressByModule = async (userId, module) => {
  return await Score.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId), // 🔥 FIXED
        exercise_type: module
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        avgScore: { $avg: "$score" },
        attempts: { $sum: 1 }
      }
    },
    {
      $project: {                // 🔥 OPTIONAL (clean output)
        date: "$_id",
        avgScore: 1,
        attempts: 1,
        _id: 0
      }
    },
    {
      $sort: { date: 1 }        // 🔥 sort by date
    }
  ]);
};

module.exports = { getProgressByModule };