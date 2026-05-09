const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { type: String, default: 'video_upload' }, // 'video_upload', 'certificate_claim', 'general'
    recipientRole: { type: String, enum: ['user', 'admin', 'all'], default: 'all' },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who triggered the notification (e.g., user who passed)
    hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours * 60 * 60 = 86400 seconds (changed from 12 to 24h)
});

module.exports = mongoose.model('Notification', notificationSchema);
