const Sentence = require("../models/PronounciationSchema");
const Score = require("../models/Score");
const DailyTask = require("../models/DailyTask");
const mongoose = require("mongoose");

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

exports.getPronunciationSentences = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const { start, end } = getTodayRange();

    // ✅ Check if already attempted today

    // ✅ Get 1 sentence per difficulty
    const getOneSentence = async (difficulty) => {
      const result = await Sentence.aggregate([
        { $match: { difficulty } },
        { $sample: { size: 1 } },
      ]);

      if (!result[0]) return null;

      return {
        ...result[0],
        taskId: result[0]._id.toString(), // ✅ FORCE taskId
      };
    };

    const easy = await getOneSentence("easy");
    const medium = await getOneSentence("medium");
    const hard = await getOneSentence("hard");

    // ❗ Safety check
    if (!easy || !medium || !hard) {
      return res.status(400).json({
        message: "Not enough sentences in DB",
      });
    }

    // ✅ Send only 3 total
    return res.status(200).json({
      success: true,
      sentences: {
        easy,
        medium,
        hard,
      },
    });
  } catch (err) {
    console.error("GET ERROR:", err);
    return res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const diff = require("diff");
const User = require("../models/User");

function getMistakes(expected, spoken) {
  const result = diff.diffWords(expected, spoken);

  return result.map((part) => ({
    text: part.value,
    type: part.added ? "wrong" : part.removed ? "missing" : "correct",
  }));
}

exports.evaluatePronunciation = async (req, res) => {
  let filePath = req.file?.path;

  try {
    const { userId, sentence } = req.body;

    console.log("FILE:", req.file);
    console.log("BODY:", req.body);

    // ✅ Validation
    if (!req.file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    if (!userId || !sentence) {
      return res
        .status(400)
        .json({ message: "userId and sentence are required" });
    }

    // ✅ Ensure extension (extra safety)
    if (!filePath.endsWith(".webm")) {
      const newPath = filePath + ".webm";
      fs.renameSync(filePath, newPath);
      filePath = newPath;
    }

    // ✅ Limit attempts
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const source = req.body.source || "practice";

    const attemptsToday = await Score.find({
      userId,
      exercise_type: "pronunciation",
      source, // ⭐ ADD THIS
      createdAt: { $gte: start, $lte: end },
    });

    console.log("ATTEMPTS FOUND:", attemptsToday);
    console.log("ATTEMPTS COUNT:", attemptsToday.length);

    if (attemptsToday.length >= 3) {
      return res.json({
        message: "You already completed today's 3 exercises",
        allowSubmit: false,
      });
    }

    // ✅ Send to AI (IMPORTANT FIX)
    const form = new FormData();
    form.append("audio", fs.createReadStream(filePath), {
      filename: "recording.webm", // ✅ force correct name
      contentType: "audio/webm",
    });

    form.append("sentence", sentence);

    console.log("🚀 Calling AI service...");
    console.time("AI Request");
    const aiResponse = await axios.post("https://mern-ai-englishapp1.onrender.com/analyze", form, {
      headers: form.getHeaders(),
      timeout: 180000, // ✅ avoid hanging
    });
    console.timeEnd("AI Request");
    console.log("✅ AI response received");
    console.log("AI DATA:", aiResponse.data);

    // ✅ Validate AI response
    const data = aiResponse.data || {};

    const spokenText = (data.text || "").trim();
    const score = data.score;
    const text = spokenText || " ";

    // 🔥 Mistakes
    const mistakes = getMistakes(sentence, data.text);

    // 🔥 Feedback
    let feedback = [];

    if (sentence !== data.text) {
      feedback.push("Some words were spoken incorrectly");
    }

    if (data.score < 6) {
      feedback.push("Try to speak more clearly");
    }

    // ✅ Save attempt
    await Score.create({
      userId,
      exercise_type: "pronunciation",
      source: source, // ⭐ ADD THIS
      user_input: data.text,
      sentence: sentence,
      score: data.score,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      improved_version: sentence,
    });
  if (req.body.taskId) {
  console.log("TASK ID RECEIVED:", req.body.taskId);

  const updateResult = await DailyTask.updateOne(
    {
      userId,
      "tasks._id": new mongoose.Types.ObjectId(req.body.taskId)
      
    },
    {
      $set: {
        "tasks.$.completed": true,
      },
    }
  );

  console.log("UPDATE RESULT:", updateResult);
}

    // ✅ Get updated attempts
    const allAttempts = await Score.find({
      userId,
      exercise_type: "pronunciation",
      createdAt: { $gte: start, $lte: end },
    });

    const totalScore = allAttempts.reduce((sum, item) => sum + item.score, 0);

    const todayAvg =
      allAttempts.length > 0 ? Math.round(totalScore / allAttempts.length) : 0;

    await User.findByIdAndUpdate(userId, {
      pronunciationScore: todayAvg,
      lastActiveDate: new Date(),
    });

    return res.json({
      message: "Evaluation complete",
      spoken_text: data.text,
      score: data.score,
      mistakes,
      feedback,
      attemptsDone: allAttempts.length,
      remaining: Math.max(0, 3 - allAttempts.length),
      todayAvg,
      allowSubmit: allAttempts.length < 3,
    });
  } catch (error) {
    console.error("❌ ERROR:", error.message);

    return res.status(500).json({
      message: "Evaluation failed",
      error: error.message, // ✅ helpful for debugging
    });
  } finally {
    // ✅ Cleanup
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  }
};
