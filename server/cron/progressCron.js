require('dotenv').config(); // Load env variables
const mongoose = require("mongoose");
const cron = require("node-cron");
const User = require("../models/User");
const { computeUserProgress } = require("../services/progressService");

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Cron job: daily at midnight (change to * * * * * for testing every minute)
cron.schedule("* * * * *", async () => {
  console.log("📊 Running daily progress update");

  try {
    const users = await User.find({});
    console.log(`🧑‍💻 Users found: ${users.length}`);

    for (const user of users) {
      try {
        const report = await computeUserProgress(user._id);
        console.log(`✅ Progress for ${user.name}:`, report.overallProgress);

        // Optionally: save snapshot for history
        // await ProgressSnapshot.create({ userId: user._id, date: new Date(), report });

      } catch (err) {
        console.error("❌ Error computing progress for", user._id, err);
      }
    }

  } catch (err) {
    console.error("❌ Error fetching users", err);
  }
});