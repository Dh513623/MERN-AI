const cron = require("node-cron");
const User = require("../models/User");
const { createDailyTaskForUser } = require("../services/dailyTaskService");

cron.schedule("0 0 * * *", async () => { // runs every day at 00:00
  console.log("🕛 Running daily task cron...");

  try {
    const users = await User.find();
    for (const user of users) {
      await createDailyTaskForUser(user._id);
    }
    console.log("✅ Daily tasks generated for all users");
  } catch (err) {
    console.error("❌ Error generating daily tasks:", err);
  }
});