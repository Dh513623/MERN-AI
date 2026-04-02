const GrammarExercise = require("../models/grammarSchema");
const Score = require("../models/Score");
const User = require("../models/User");

/**
 * Helper → Today's date range
 */
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Shuffle Function
 */
const shuffleArray = (array) => {
  return array.sort(() => 0.5 - Math.random());
};

/**
 * ===============================
 * GET DAILY GRAMMAR TEST
 * ===============================
 */
exports.getDailyGrammarTest = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const { start, end } = getTodayRange();

    // Check if already attempted today
    const already = await Score.findOne({
      userId,
      exercise_type: "grammar",
      date: { $gte: start, $lte: end }
    });

    if (already) {
      return res.status(400).json({
        message: "Already attempted today's grammar test"
      });
    }

    // Fetch all questions of each type
    const fillBlankAll = await GrammarExercise.find({
      module: "grammar",
      type: "fill_blank"
    });

    const errorCorrectionAll = await GrammarExercise.find({
      module: "grammar",
      type: "error_correction"
    });

    const rearrangeAll = await GrammarExercise.find({
      module: "grammar",
      type: "rearrange"
    });

    console.log("Fill Blank Total:", fillBlankAll.length);
    console.log("Error Correction Total:", errorCorrectionAll.length);
    console.log("Rearrange Total:", rearrangeAll.length);

    if (
      fillBlankAll.length < 5 ||
      errorCorrectionAll.length < 5 ||
      rearrangeAll.length < 5
    ) {
      return res.status(400).json({
        message: "Not enough questions in DB",
        details: {
          fill_blank: fillBlankAll.length,
          error_correction: errorCorrectionAll.length,
          rearrange: rearrangeAll.length
        }
      });
    }

    // Pick 5 random from each
    const finalQuestions = [
      ...shuffleArray(fillBlankAll).slice(0, 5),
      ...shuffleArray(errorCorrectionAll).slice(0, 5),
      ...shuffleArray(rearrangeAll).slice(0, 5)
    ];

    return res.status(200).json({
      success: true,
      totalQuestions: finalQuestions.length,
      questions: finalQuestions
    });

  } catch (err) {
    console.error("GET ERROR:", err);
    return res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
};

/**
 * ===============================
 * SUBMIT DAILY GRAMMAR TEST
 * ===============================
 */
exports.submitDailyGrammarTest = async (req, res) => {
  try {
    const { userId, answers } = req.body;

    if (!userId || !answers) {
      return res.status(400).json({
        message: "userId and answers are required"
      });
    }

    if (!Array.isArray(answers) || answers.length !== 15) {
      return res.status(400).json({
        message: "You must submit exactly 15 answers"
      });
    }

    const { start, end } = getTodayRange();

    const alreadyAttempted = await Score.findOne({
      userId,
      exercise_type: "grammar",
      date: { $gte: start, $lte: end }
    });

    if (alreadyAttempted) {
      return res.status(400).json({
        message: "Already submitted today"
      });
    }

    const questionIds = answers.map(a => a.questionId);

    const questions = await GrammarExercise.find({
      _id: { $in: questionIds }
    });

    const questionMap = new Map();
    questions.forEach(q => {
      questionMap.set(q._id.toString(), q);
    });

    let correctCount = 0;
    let resultDetails = [];

    for (const item of answers) {
      const question = questionMap.get(item.questionId);
      if (!question) continue;

      const userAnswer = (item.user_input || "").trim().toLowerCase();
      const correctAnswer = question.answer.trim().toLowerCase();

      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) correctCount++;

      resultDetails.push({
        question: question.question,
        correctAnswer: question.answer,
        userAnswer: item.user_input,
        isCorrect
      });
    }

    const finalScore = Number(((correctCount / 15) * 10).toFixed(2));

    await Score.create({
      userId,
      exercise_type: "grammar",
      user_input: "Daily Grammar Test",
      score: finalScore,
      strengths: correctCount >= 10 ? ["Good grammar understanding"] : [],
      weaknesses: correctCount < 10 ? ["Needs improvement"] : [],
      improved_version: JSON.stringify(resultDetails),
      date: new Date()
    });

    const allScores = await Score.find({
      userId,
      exercise_type: "grammar"
    });

    const total = allScores.reduce((sum, s) => sum + s.score, 0);
    const average = Number((total / allScores.length).toFixed(2));

    await User.findByIdAndUpdate(userId, {
      grammarScore: average,
      lastActiveDate: new Date()
    });

    return res.status(200).json({
      success: true,
      correctAnswers: correctCount,
      finalScore,
      averageGrammarScore: average,
      resultDetails
    });

  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    return res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
};