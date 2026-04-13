const Sentence = require("../models/PronounciationSchema");
const Score = require("../models/Score");

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
    const alreadyAttempted = await Score.findOne({
      userId,
      exercise_type: "pronunciation",
      date: { $gte: start, $lte: end }
    });

    // 🚫 If attempted → block
    if (alreadyAttempted) {
      return res.status(200).json({
        success: false,
        message: "You already attempted today. Try tomorrow."
      });
    }

    // ✅ Get 1 sentence per difficulty
    const getOneSentence = async (difficulty) => {
      const result = await Sentence.aggregate([
        { $match: { difficulty } },
        { $sample: { size: 1 } }
      ]);
      return result[0];
    };

    const easy = await getOneSentence("easy");
    const medium = await getOneSentence("medium");
    const hard = await getOneSentence("hard");

    // ❗ Safety check
    if (!easy || !medium || !hard) {
      return res.status(400).json({
        message: "Not enough sentences in DB"
      });
    }

    // ✅ Send only 3 total
    return res.status(200).json({
      success: true,
      sentences: {
        easy,
        medium,
        hard
      }
    });

  } catch (err) {
    console.error("GET ERROR:", err);
    return res.status(500).json({
      message: "Server Error",
      error: err.message
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

  return result.map(part => ({
    text: part.value,
    type: part.added
      ? "wrong"
      : part.removed
      ? "missing"
      : "correct"
  }));
}

// exports.evaluatePronunciation = async (req, res) => {
//   let filePath = req.file?.path;

//   try {
//     const { userId, sentence } = req.body;
//     console.log("FILE:", req.file);
//     console.log("BODY:", req.body);

//     if (!req.file) {
//       return res.status(400).json({ message: "Audio file is required" });
//     }

//     if (!userId || !sentence) {
//       return res.status(400).json({ message: "userId and sentence are required" });
//     }

//     // ✅ Today range
//     const start = new Date();
//     start.setHours(0, 0, 0, 0);

//     const end = new Date();
//     end.setHours(23, 59, 59, 999);

//     // ✅ Check attempts today
//     const attemptsToday = await Score.find({
//       userId,
//       exercise_type: "pronunciation",
//       createdAt: { $gte: start, $lte: end }
//     });

//     if (attemptsToday.length >= 3) {
//       return res.json({
//         message: "You already completed today's 3 exercises",
//         allowSubmit: false
//       });
//     }

//     // ✅ Send to AI
//     const form = new FormData();
//     form.append("audio", fs.createReadStream(filePath));
//     form.append("sentence", sentence);

//     const aiResponse = await axios.post(
//       "http://127.0.0.1:8000/analyze",
//       form,
//       { headers: form.getHeaders() }
//     );

//     const data = aiResponse.data;

//     // 🔥 Mistakes
//     const mistakes = getMistakes(sentence, data.text);

//     // 🔥 Feedback
//     let feedback = [];

//     if (sentence !== data.text) {
//       feedback.push("Some words were spoken incorrectly");
//     }

//     if (data.score < 6) {
//       feedback.push("Try to speak more clearly");
//     }

//     // ✅ Save attempt
//     await Score.create({
//       userId,
//       exercise_type: "pronunciation",
//       user_input: data.text,
//       sentence: sentence,
//       score: data.score,
//       strengths: data.strengths,
//       weaknesses: data.weaknesses,
//       improved_version: sentence
//     });

//     // ✅ Get today's attempts
//     const allAttempts = await Score.find({
//       userId,
//       exercise_type: "pronunciation",
//       createdAt: { $gte: start, $lte: end }
//     });

//     // ✅ Calculate today's avg
//     const totalScore = allAttempts.reduce((sum, item) => sum + item.score, 0);
//     const todayAvg = Math.round(totalScore / allAttempts.length);

//     // ✅ AFTER 3 attempts → update USER
//     if (allAttempts.length === 3) {

//       // 🔥 Get ALL pronunciation scores (history)
//       const allScores = await Score.find({
//         userId,
//         exercise_type: "pronunciation"
//       });

//       const totalAll = allScores.reduce((sum, s) => sum + s.score, 0);
//       const overallAvg = Number((totalAll / allScores.length).toFixed(2));

//       // ✅ Update user schema
//       await User.findByIdAndUpdate(userId, {
//         pronunciationScore: overallAvg,
//         lastActiveDate: new Date()
//       });
//     }

//     return res.json({
//       message: "Evaluation complete",
//       spoken_text: data.text,
//       score: data.score,

//       mistakes,
//       feedback,

//       attemptsDone: allAttempts.length,
//       remaining: 3 - allAttempts.length,
//       todayAvg,

//       allowSubmit: allAttempts.length < 3
//     });

//   } catch (error) {
//     console.error("ERROR:", error.message);
//     return res.status(500).json({ message: "Evaluation failed" });
//   } finally {
//     if (filePath) {
//       try {
//         fs.unlinkSync(filePath);
//       } catch {}
//     }
//   }
// };
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
      return res.status(400).json({ message: "userId and sentence are required" });
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

    const attemptsToday = await Score.find({
      userId,
      exercise_type: "pronunciation",
      createdAt: { $gte: start, $lte: end }
    });

    if (attemptsToday.length >= 3) {
      return res.json({
        message: "You already completed today's 3 exercises",
        allowSubmit: false
      });
    }

    // ✅ Send to AI (IMPORTANT FIX)
    const form = new FormData();
    form.append("audio", fs.createReadStream(filePath), {
      filename: "recording.webm", // ✅ force correct name
      contentType: "audio/webm"
    });

    form.append("sentence", sentence);

    const aiResponse = await axios.post(
      "http://127.0.0.1:8000/analyze",
      form,
      {
        headers: form.getHeaders(),
        timeout: 20000 // ✅ avoid hanging
      }
    );

    // ✅ Validate AI response
    if (!aiResponse.data || !aiResponse.data.text) {
      throw new Error("Invalid AI response");
    }

    const data = aiResponse.data;

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
      user_input: data.text,
      sentence: sentence,
      score: data.score,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      improved_version: sentence
    });

    // ✅ Get updated attempts
    const allAttempts = await Score.find({
      userId,
      exercise_type: "pronunciation",
      createdAt: { $gte: start, $lte: end }
    });

    const totalScore = allAttempts.reduce((sum, item) => sum + item.score, 0);
    const todayAvg = Math.round(totalScore / allAttempts.length);

    // ✅ Update overall score after 3 attempts
    if (allAttempts.length === 3) {
      const allScores = await Score.find({
        userId,
        exercise_type: "pronunciation"
      });

      const totalAll = allScores.reduce((sum, s) => sum + s.score, 0);
      const overallAvg = Number((totalAll / allScores.length).toFixed(2));

      await User.findByIdAndUpdate(userId, {
        pronunciationScore: overallAvg,
        lastActiveDate: new Date()
      });
    }

    return res.json({
      message: "Evaluation complete",
      spoken_text: data.text,
      score: data.score,
      mistakes,
      feedback,
      attemptsDone: allAttempts.length,
      remaining: 3 - allAttempts.length,
      todayAvg,
      allowSubmit: allAttempts.length < 3
    });

  } catch (error) {
    console.error("❌ ERROR:", error.message);

    return res.status(500).json({
      message: "Evaluation failed",
      error: error.message // ✅ helpful for debugging
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