const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./routes/authRoutes");
const grammarRoutes = require("./routes/grammarRoutes");
const pronunciationRoutes = require("./routes/pronunciationRoutes");
const vocabRoutes = require("./routes/vocabRoutes");
const progressRoutes = require("./routes/progressRoutes");


app.use("/api/auth", authRoutes);
app.use("/api/grammar", grammarRoutes);
app.use("/api/pronunciation", pronunciationRoutes);
app.use("/api/vocab", vocabRoutes);
app.use("/api/progress", progressRoutes)



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});