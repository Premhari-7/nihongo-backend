const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    certificateId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    courseName: { type: String, required: true }, // e.g., "JLPT N5 Kanji"
    jlptLevel: { type: String, required: true },
    section: { type: String, required: true },
    score: { type: Number, required: true },
    issuedDate: { type: Date, default: Date.now },
    verificationCode: { type: String, required: true, unique: true },
    revoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
    pdfUrl: { type: String }, // Optional, since we generate on the fly
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);
