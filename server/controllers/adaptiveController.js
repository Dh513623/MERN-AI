const { generateTodayPlan } = require('../services/adaptiveService')

async function getTodayPlan(req, res) {
  try {
    const userId = req.user.id; // from auth middleware

    const plan = await generateTodayPlan(userId);

    res.json(plan);

  } catch (error) {
    res.status(500).json({ message: "Error generating plan" });
  }
}

module.exports = { getTodayPlan };