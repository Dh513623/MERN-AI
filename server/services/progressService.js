// services/progressService.js
const { getProgressByModule } = require("../utils/progressUtils");

async function computeUserProgress(userId) {
  const grammar = await getProgressByModule(userId, "grammar");
  const vocabulary = await getProgressByModule(userId, "vocabulary");
  const pronunciation = await getProgressByModule(userId, "pronunciation");
  const speaking = await getProgressByModule(userId, "speaking");
  const fluency = await getProgressByModule(userId, "fluency");

  const getAvg = (data) => {
    if (!data.length) return 0;
    const total = data.reduce((sum, d) => sum + d.avgScore, 0);
    return Math.round(total / data.length);
  };

  const report = {
    overallProgress: {
      grammar: getAvg(grammar),
      vocabulary: getAvg(vocabulary),
      pronunciation: getAvg(pronunciation),
      speaking: getAvg(speaking),
      fluency: getAvg(fluency)
    },
    charts: { grammar, vocabulary, pronunciation, speaking, fluency }
  };

  return report;
}

module.exports = { computeUserProgress };