// models/Progress.js
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalExercises: {
    type: Number,
    default: 0
  },
  averageFluencyScore: {
    type: Number,
    default: 0
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  lastExerciseDate: {
    type: Date,
    default: null
  },
  history: [
    {
      exercise_type: { type: String, required: true },
      fluency_score: { type: Number, required: true },
      date: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('Progress', progressSchema);