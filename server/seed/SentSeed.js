const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("../config/db");
dotenv.config();

const SpeakingTopic=require('../models/SpeakingTopic');
const sentences = require("../utils/speakingTopics_500.json");
//seeding for speaking topic
async function seedSentences() {
  try {
    // ✅ Wait for DB connection before doing anything
    await connectDB();

    const count = await SpeakingTopic.countDocuments();
    if (count === 0) {
      await SpeakingTopic.insertMany(sentences);
      console.log("✅ 500 sentences inserted successfully!");
    } else {
      await SpeakingTopic.deleteMany({});
      await SpeakingTopic.insertMany(sentences);
      console.log("✅ 500 sentences inserted successfully! after deleting the existing");
    }
    process.exit();
  } catch (error) {
    console.error("Error seeding sentences:", error.message);
    process.exit(1);
  }
}
seedSentences();


/*
//seeding for fluency topic

const FluencySentence = require("../models/FluencySentence");
const sentences = require("../utils/500_sentences.json");

async function seedSentences() {
  try {
    // ✅ Wait for DB connection before doing anything
    await connectDB();

    const count = await FluencySentence.countDocuments();
    if (count === 0) {
      await FluencySentence.insertMany(sentences);
      console.log("✅ 500 sentences inserted successfully!");
    } else {
      console.log("⚠️ Sentences already exist in DB. Skipping insertion.");
    }
    process.exit();
  } catch (error) {
    console.error("Error seeding sentences:", error.message);
    process.exit(1);
  }
}
  seedSentences();

*/


