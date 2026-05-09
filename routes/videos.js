const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const Notification = require('../models/Notification');

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
        // Create unique filename
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for local videos
});

// @route   POST /api/videos/upload
// @desc    Upload a new educational video (Admin only)
router.post('/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No video file provided' });
        }

        const { title, description, jlptLevel, section, uploadedBy, order } = req.body;

        if (!title || !jlptLevel || !section) {
            return res.status(400).json({ msg: 'Please enter all required fields' });
        }

        // Auto-calculate order if not provided
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

        // Broadcast notification to all users
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
// @desc    Get all videos (optionally filtered by JLPT level and section)
router.get('/', async (req, res) => {
    try {
        const { level, section } = req.query;
        let query = {};
        if (level) {
            query.jlptLevel = level;
        }
        if (section) {
            query.section = section;
        }
        
        // Sort by JLPT level, section, then order number
        const videos = await Video.find(query).sort({ jlptLevel: 1, section: 1, order: 1 });
        res.json(videos);
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video (Admin only)
router.delete('/:id', async (req, res) => {
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

        await Video.findByIdAndDelete(req.params.id);
        
        // Also delete associated notifications
        await Notification.deleteMany({ videoId: req.params.id });

        res.json({ msg: 'Video removed' });
    } catch (err) {
        console.error('Error deleting video:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
