const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    explanation: { type: String }
});

const quizSchema = new mongoose.Schema({
    jlptLevel: { type: String, required: true }, // e.g., 'N5'
    section: { type: String, required: true },   // e.g., 'Kanji'
    questions: [questionSchema]
}, { timestamps: true });

// Ensure one quiz bank per level/section combination
quizSchema.index({ jlptLevel: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Quiz', quizSchema);
