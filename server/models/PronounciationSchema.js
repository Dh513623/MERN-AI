const mongoose = require("mongoose");

const sentenceSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true
  }
});

module.exports = mongoose.model("pronouncation", sentenceSchema);

 