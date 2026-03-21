const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
dotenv.config();

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes=require("./routes/authRoutes");
const fluencyRoute=require("./routes/fluencyRoutes");
const speakingRoute=require("./routes/speakingRoute");
const adaptiveRoute=require('./routes/adaptiveRoutes');
const dailyTaskRoute=require('./routes/dailyTaskRoutes');

app.use('/api/auth',authRoutes);
app.use('/api/fluency',fluencyRoute);
app.use('/api/speaking',speakingRoute);
app.use('/api/adaptive',adaptiveRoute);
app.use('/api/dailyTask',dailyTaskRoute);

// port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});