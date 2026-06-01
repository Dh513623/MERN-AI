const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");


dotenv.config();
connectDB();

const app = express();
require("./cron/levelUpdater");
require("./cron/dailyTaskCron");
require("./cron/progressCron");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./routes/authRoutes");
const grammarRoutes = require("./routes/grammarRoutes");
const pronunciationRoutes = require("./routes/pronunciationRoutes");
const vocabRoutes = require("./routes/vocabRoutes");
const progressRoutes = require("./routes/progressRoutes");
const dailyTaskRoutes = require("./routes/dailyTaskRoutes");
const speakingRoutes = require("./routes/speakingRoutes");
const fluencyRoutes = require("./routes/fluencyRoutes");





app.use("/api/auth", authRoutes);
app.use("/api/grammar", grammarRoutes);
app.use("/api/pronunciation", pronunciationRoutes);
app.use("/api/vocab", vocabRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/daily-tasks", dailyTaskRoutes);
app.use("/api/speaking", speakingRoutes);
app.use("/api/fluency", fluencyRoutes);



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});