const mongoose = require("mongoose");

const grammarSchema = new mongoose.Schema({
  module: {
    type: String,
    default: "grammar"
  },
  type: String,
  question: mongoose.Schema.Types.Mixed,
  options: [String],
  answer: String,
  explanation: String,
  level: String
});

module.exports = mongoose.model("GrammarExercise", grammarSchema);