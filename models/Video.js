const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    filename: {
        type: String,
        required: true
    },
    jlptLevel: {
        type: String,
        enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
        required: true
    },
    section: {
        type: String,
        enum: ['Kanji', 'Vocabulary'],
        required: true
    },
    order: {
        type: Number,
        default: 1
    },
    uploadedBy: {
        type: String,
        default: 'admin'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for fast sorted queries (matches GET /api/videos sort pattern)
VideoSchema.index({ jlptLevel: 1, section: 1, order: 1 });

module.exports = mongoose.model('Video', VideoSchema);
