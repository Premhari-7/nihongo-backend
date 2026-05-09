const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: String, required: true }, // e.g., 'N5-Kanji'
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    highestWatched: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

// A user can only have one progress record per video in a course
progressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
