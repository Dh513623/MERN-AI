
const Score=require('../models/Score');
async function generateTodayPlan(userId) {
  const latestScore = await Score.findOne({
    userId,
    exercise_type: "speaking",
  }).sort({ date: -1 });

  if (!latestScore) {
    return {
      message: "No speaking evaluation found. Complete speaking test first.",
    };
  }

  const { grammarScore, fluencyScore, vocabularyScore, pronunciationScore } =
    latestScore;

  const scores = {
    grammar: grammarScore,
    fluency: fluencyScore,
    vocabulary: vocabularyScore,
    pronunciation: pronunciationScore,
  };

  const weakSkill = Object.keys(scores).reduce((a, b) =>
    scores[a] < scores[b] ? a : b,
  );

  const taskTemplates = {
    grammar: [
      { task: "Correct 5 sentences", count: 5 },
      { task: "Identify tense mistakes", count: 5 },
    ],
    fluency: [
      { task: "Combine 5 sentence pairs", count: 5 },
      { task: "Speak for 2 minutes on a topic", duration: "2 minutes" },
    ],
    vocabulary: [
      { task: "Learn 3 new words", count: 3 },
      { task: "Use each word in a sentence", count: 3 },
    ],
    pronunciation: [
      { task: "Read one paragraph aloud", duration: "5 minutes" },
      { task: "Practice shadowing", duration: "5 minutes" },
    ],
  };

  return {
    weak_area: weakSkill,
    today_plan: taskTemplates[weakSkill],
  };
}

module.exports = { generateTodayPlan };
