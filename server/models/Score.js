
const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topicId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'SpeakingTopic',
  required: function () {
    return this.exercise_type === "speaking";
  }
},
  exercise_type: {
    type: String,
    required: true,
    enum: ['grammar', 'vocabulary', 'pronunciation', 'fluency', 'speaking']
  },
  user_input: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: function () {
      return this.exercise_type !== "speaking";
    }
  },
  grammarScore: {
    type: Number,
    required: function () {
      return this.exercise_type === "speaking";
    },
  },
  fluencyScore: {
    type: Number,
    required: function () {
      return this.exercise_type === "speaking";
    }
  },

  vocabularyScore: {
    type: Number,
    required: function () {
      return this.exercise_type === "speaking";
    }
  },

  pronunciationScore: {
    type: Number,
    required: function () {
      return this.exercise_type === "speaking";
    }
  },

  overallScore: {
    type: Number,
    required: function () {
      return this.exercise_type === "speaking";
    }
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  improved_version: {
    type: String,
    required: true
  }
},{timestamps:true}
);

module.exports = mongoose.model('Score', scoreSchema);