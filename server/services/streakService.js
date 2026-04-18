const User = require("../models/User");
const updateStreak = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  today.setHours(0, 0, 0, 0);

  let lastDate = null;

  if (user.lastActiveDate) {
    lastDate = new Date(user.lastActiveDate);
    lastDate.setHours(0, 0, 0, 0);
  }

  if (!lastDate || user.dailyStreak === 0) {
    user.dailyStreak = 1;
  } else {
    const diffDays = Math.floor(
      (today - lastDate) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      user.dailyStreak = (user.dailyStreak || 0) + 1;
    } else if (diffDays > 1) {
      user.dailyStreak = 1;
    }
  }

  if (!user.maxStreak) {
    user.maxStreak = 0;
  }

  if (user.dailyStreak > user.maxStreak) {
    user.maxStreak = user.dailyStreak;
  }

  user.lastActiveDate = today;

  await user.save();

  return user;
};

module.exports = { updateStreak };