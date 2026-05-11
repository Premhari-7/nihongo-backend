const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const Notification = require('../models/Notification');
const Progress = require('../models/Progress');
const { adminAuth } = require('../middleware/auth-middleware');

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
];

// Set up local storage for videos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/videos');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const sanitized = file.originalname
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .substring(0, 100);
        cb(null, Date.now() + '_' + sanitized);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video files (MP4, WebM, MOV, AVI, MKV) are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ════════════════════════════════════════════════
// IMPORTANT: Static path routes MUST come before /:id
// Otherwise Express matches "reorder" as an :id param
// ════════════════════════════════════════════════

// @route   POST /api/videos/upload
// @desc    Upload a new educational video (Admin only)
router.post('/upload', adminAuth, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No video file provided' });
        }

        const { title, description, jlptLevel, section, uploadedBy, order } = req.body;

        if (!title || !jlptLevel || !section) {
            return res.status(400).json({ msg: 'Please enter all required fields' });
        }

        const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
        if (!validLevels.includes(jlptLevel)) {
            return res.status(400).json({ msg: 'Invalid JLPT level' });
        }

        const validSections = ['Kanji', 'Vocabulary'];
        if (!validSections.includes(section)) {
            return res.status(400).json({ msg: 'Invalid section' });
        }

        let videoOrder = parseInt(order) || 0;
        if (!videoOrder) {
            const count = await Video.countDocuments({ jlptLevel, section });
            videoOrder = count + 1;
        }

        const newVideo = new Video({
            title,
            description: description || '',
            filename: req.file.filename,
            jlptLevel,
            section,
            order: videoOrder,
            uploadedBy: uploadedBy || 'admin'
        });

        const savedVideo = await newVideo.save();

        const newNotification = new Notification({
            message: `New ${jlptLevel} ${section} video available: ${title}`,
            type: 'video_upload',
            recipientRole: 'user',
            videoId: savedVideo._id
        });
        await newNotification.save();

        res.json(savedVideo);
    } catch (err) {
        console.error('Video upload error:', err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// @route   GET /api/videos
// @desc    Get all videos (optionally filtered) — PUBLIC for students
router.get('/', async (req, res) => {
    try {
        const { level, section } = req.query;
        let query = {};
        if (level) query.jlptLevel = level;
        if (section) query.section = section;

        const videos = await Video.find(query)
            .sort({ jlptLevel: 1, section: 1, order: 1 })
            .lean();
        res.json(videos);
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).send('Server error');
    }
});

// ═══════════════════════════════════════════════════
// Static routes BEFORE the /:id wildcard route
// ═══════════════════════════════════════════════════

// @route   PUT /api/videos/reorder/batch
// @desc    Atomic batch reorder (Admin only)
router.put('/reorder/batch', adminAuth, async (req, res) => {
    try {
        const { updates } = req.body; // Array of { id, order }

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ msg: 'Invalid reorder data' });
        }

        // Atomic bulkWrite — all updates in one DB round-trip
        const bulkOps = updates.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { $set: { order: item.order } }
            }
        }));

        await Video.bulkWrite(bulkOps, { ordered: false });

        // Return updated videos for the affected section
        // (avoids full refetch on the frontend)
        const firstVideo = await Video.findById(updates[0].id).lean();
        let updatedVideos = [];
        if (firstVideo) {
            updatedVideos = await Video.find({
                jlptLevel: firstVideo.jlptLevel,
                section: firstVideo.section
            }).sort({ order: 1 }).lean();
        }

        res.json({ msg: 'Videos reordered successfully', videos: updatedVideos });
    } catch (err) {
        console.error('Error reordering videos:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/videos/normalize/:level/:section
// @desc    Normalize order values for a section (Admin only)
router.put('/normalize/:level/:section', adminAuth, async (req, res) => {
    try {
        const { level, section } = req.params;
        const videos = await Video.find({ jlptLevel: level, section }).sort({ order: 1 });

        const bulkOps = videos.map((v, i) => ({
            updateOne: {
                filter: { _id: v._id },
                update: { $set: { order: i + 1 } }
            }
        }));

        if (bulkOps.length > 0) {
            await Video.bulkWrite(bulkOps, { ordered: false });
        }

        const normalized = await Video.find({ jlptLevel: level, section }).sort({ order: 1 }).lean();
        res.json({ msg: 'Order normalized', videos: normalized });
    } catch (err) {
        console.error('Error normalizing order:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════
// Wildcard /:id routes LAST
// ═══════════════════════════════════════════════════

// @route   PUT /api/videos/:id
// @desc    Update video details (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ msg: 'Video not found' });
        }

        const { title, description, jlptLevel, section, order } = req.body;
        const oldLevel = video.jlptLevel;
        const oldSection = video.section;

        // Validate JLPT level if provided
        if (jlptLevel) {
            const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
            if (!validLevels.includes(jlptLevel)) {
                return res.status(400).json({ msg: 'Invalid JLPT level' });
            }
        }

        // Validate section if provided
        if (section) {
            const validSections = ['Kanji', 'Vocabulary'];
            if (!validSections.includes(section)) {
                return res.status(400).json({ msg: 'Invalid section' });
            }
        }

        if (title) video.title = title;
        if (description !== undefined) video.description = description;
        if (jlptLevel) video.jlptLevel = jlptLevel;
        if (section) video.section = section;
        if (order !== undefined) video.order = parseInt(order);

        // If section/level changed, auto-assign order at end of new section
        const sectionChanged = (jlptLevel && jlptLevel !== oldLevel) || (section && section !== oldSection);
        if (sectionChanged && order === undefined) {
            const count = await Video.countDocuments({
                jlptLevel: video.jlptLevel,
                section: video.section,
                _id: { $ne: video._id }
            });
            video.order = count + 1;
        }

        const updatedVideo = await video.save();

        // If section changed, normalize old section's order
        if (sectionChanged) {
            const oldVideos = await Video.find({ jlptLevel: oldLevel, section: oldSection }).sort({ order: 1 });
            const bulkOps = oldVideos.map((v, i) => ({
                updateOne: { filter: { _id: v._id }, update: { $set: { order: i + 1 } } }
            }));
            if (bulkOps.length > 0) await Video.bulkWrite(bulkOps, { ordered: false });
        }

        res.json(updatedVideo);
    } catch (err) {
        console.error('Error updating video:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video and cascade-clean related records (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ msg: 'Video not found' });
        }

        // Delete from local filesystem
        const filePath = path.join(__dirname, '../uploads/videos', video.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Cascade: Remove all progress records referencing this video
        const deletedProgress = await Progress.deleteMany({ videoId: req.params.id });
        console.log(`Cascade: Removed ${deletedProgress.deletedCount} progress records for video ${req.params.id}`);

        await Video.findByIdAndDelete(req.params.id);
        await Notification.deleteMany({ videoId: req.params.id });

        // Normalize remaining order with bulkWrite (atomic, fast)
        const remaining = await Video.find({
            jlptLevel: video.jlptLevel,
            section: video.section
        }).sort({ order: 1 });

        const bulkOps = remaining.map((v, i) => ({
            updateOne: { filter: { _id: v._id }, update: { $set: { order: i + 1 } } }
        }));
        if (bulkOps.length > 0) await Video.bulkWrite(bulkOps, { ordered: false });

        res.json({ msg: 'Video removed and references cleaned', cascadeDeleted: deletedProgress.deletedCount });
    } catch (err) {
        console.error('Error deleting video:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
