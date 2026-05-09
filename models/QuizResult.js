const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jlptLevel: { type: String, required: true },
    section: { type: String, required: true },
    score: { type: Number, required: true }, // Percentage (0-100)
    passed: { type: Boolean, required: true },
    attempts: { type: Number, default: 1 }
}, { timestamps: true });

// Track highest score per user/level/section
quizResultSchema.index({ userId: 1, jlptLevel: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('QuizResult', quizResultSchema);
