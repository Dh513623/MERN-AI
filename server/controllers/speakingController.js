const Score = require("../models/Score");
const User = require("../models/User");
const SpeakingTopic = require("../models/SpeakingTopic");

const { evaluateSpeaking } = require("../services/aiSpeakingService");

// -----------------------------
// Main speaking handler
const speakingEvaluate = async (req, res) => {
  const mode = req.body?.mode || req.query?.mode;
  let audioPath;
  try {
    console.log("MODE:", mode);
    console.log("Received file:", req.file);
    console.log("Request body:", req.body);

    // 1️⃣ Fetch user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: "Invalid user" });

    // -----------------------------
    // 2️⃣ Generate mode: return new topic
    if (mode === "generate") {
      const difficultyMap = {
        Beginner: "easy",
        Intermediate: "medium",
        Advanced: "hard",
      };
      const difficulty = difficultyMap[user.level];

      const attempted = await Score.find({
        userId: user._id,
        exercise_type: "speaking",
      }).select("topicId");
      const attemptedIds = attempted.map((item) => item.topicId);

      const topic = await SpeakingTopic.findOne({
        difficulty,
        _id: { $nin: attemptedIds },
      });

      if (!topic)
        return res.json({
          message: "🎉 You have completed all topics in this level!",
        });

      return res.json({
        topicId: topic._id,
        title: topic.title,
        cuePoints: topic.cuePoints,
        difficulty: topic.difficulty,
      });
    }

    // -----------------------------
    // 3️⃣ Evaluate mode: process audio
    else if (mode === "evaluate") {
      const spokenText = req.body.transcript;
      const topicId = req.body.topicId;

      if (!spokenText?.trim()) {
        return res
          .status(400)
          .json({ message: "Speech not detected. Please speak clearly." });
      }

      if (!spokenText?.trim())
        return res
          .status(400)
          .json({ message: "Speech not detected. Please speak clearly." });

      // AI Evaluation (text)
      const topic = await SpeakingTopic.findById(topicId);
      console.log("👉 FINAL TEXT SENT TO AI:", spokenText);
      const aiResult = await evaluateSpeaking(spokenText, topic);

     
      
      const overallScore = Number(
        (
          (aiResult.grammarScore +
            aiResult.fluencyScore +
            aiResult.vocabularyScore +
            aiResult.pronunciationScore +
            aiResult.confidenceScore) /
          5
        ).toFixed(2),
      );

      // Save score
      const score = new Score({
        userId: user._id,
        topicId,
        exercise_type: "speaking",
        user_input: spokenText,
        grammarScore: aiResult.grammarScore,
        fluencyScore: aiResult.fluencyScore,
        vocabularyScore: aiResult.vocabularyScore,
        pronunciationScore: aiResult.pronunciationScore,
        confidenceScore: aiResult.confidenceScore,
        overallScore,
        strengths: aiResult.strengths,
        weaknesses: aiResult.weaknesses,
        improved_version: aiResult.improved_version,
      });

      await score.save();

      // Update user's average speaking score
      const allScores = await Score.find({
        userId: user._id,
        exercise_type: "speaking",
      });
      const avg = allScores.length
        ? allScores.reduce((sum, item) => sum + item.overallScore, 0) /
          allScores.length
        : 0;
      await User.findByIdAndUpdate(user._id, {
        speakingScore: Math.round(avg),
      });

      // Response
      return res.status(200).json({
        spoken_text: spokenText,
        grammarScore: aiResult.grammarScore,
        fluencyScore: aiResult.fluencyScore,
        vocabularyScore: aiResult.vocabularyScore,
        pronunciationScore: aiResult.pronunciationScore,
        confidenceScore: aiResult.confidenceScore,
        overallScore,
        strengths: aiResult.strengths,
        weaknesses: aiResult.weaknesses,
        improved_version: aiResult.improved_version,
      });
    }

    // Invalid mode
    else return res.status(400).json({ message: "Invalid mode" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { speakingEvaluate };
