const cron = require("node-cron");
const User = require("../models/User");
const { updateUserLevelWeekly } = require("../services/adaptiveService");

// 🔥 RUN EVERY MINUTE (for testing)
cron.schedule("0 0 * * 0", async () => {
  console.log("🔄 CRON RUNNING...");

  try {
    const users = await User.find();

    for (const user of users) {
      console.log("➡️ Processing:", user._id);

      const result = await updateUserLevelWeekly(user._id);

      console.log("✅ Result:", result);
    }

    console.log("🎉 CRON COMPLETED\n");
  } catch (err) {
    console.error("❌ Cron Error:", err.message);
  }
});