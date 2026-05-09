const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const Video = require('../models/Video');
const Certificate = require('../models/Certificate');
const QuizResult = require('../models/QuizResult');

// Get overall progress summary for a user
router.get('/summary/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const totalVideos = await Video.countDocuments();
        const completedVideos = await Progress.countDocuments({ userId, isCompleted: true });
        
        let percentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
        
        res.json({ 
            percentage, 
            completedVideos, 
            totalVideos 
        });
    } catch (err) {
        console.error('Error fetching progress summary:', err);
        res.status(500).send('Server error');
    }
});

// Get detailed course-specific progress (0-100%)
router.get('/course/:userId/:level/:section', async (req, res) => {
    try {
        const { userId, level, section } = req.params;

        // 1. Check if Certificate exists (100%)
        const cert = await Certificate.findOne({ userId, jlptLevel: level, section });
        if (cert && !cert.revoked) {
            return res.json({ percentage: 100, stage: 'certificate' });
        }

        // 2. Check if Quiz attempted/passed (75%)
        const quiz = await QuizResult.findOne({ userId, jlptLevel: level, section });
        if (quiz) {
            return res.json({ percentage: 75, stage: 'quiz' });
        }

        // 3. Check video progress (0 - 50%)
        // First find all videos for this specific course
        const videos = await Video.find({ jlptLevel: level, section });
        const totalCourseVideos = videos.length;

        if (totalCourseVideos === 0) {
            return res.json({ percentage: 0, stage: 'videos' });
        }

        // Get array of video IDs for this course
        const videoIds = videos.map(v => v._id);

        // Count how many of these specific videos the user has completed
        const completedVideos = await Progress.countDocuments({ 
            userId, 
            videoId: { $in: videoIds },
            isCompleted: true 
        });

        // Calculate proportional progress up to 50%
        let percentage = Math.round((completedVideos / totalCourseVideos) * 50);

        res.json({ percentage, stage: 'videos', completedVideos, totalCourseVideos });

    } catch (err) {
        console.error('Error fetching course progress:', err);
        res.status(500).send('Server error');
    }
});

// Get progress for a user in a specific course
router.get('/:userId/:courseId', async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        const progress = await Progress.find({ userId, courseId });
        res.json(progress);
    } catch (err) {
        console.error('Error fetching progress:', err);
        res.status(500).json({ error: 'Server error fetching progress' });
    }
});

// Update progress
router.post('/update', async (req, res) => {
    const { userId, courseId, videoId, highestWatched, isCompleted } = req.body;
    try {
        let progress = await Progress.findOne({ userId, videoId });
        
        if (!progress) {
            progress = new Progress({
                userId,
                courseId,
                videoId,
                highestWatched: highestWatched || 0,
                isCompleted: isCompleted || false
            });
        } else {
            // Only update if the new highestWatched is greater, to prevent losing progress
            if (highestWatched > progress.highestWatched) {
                progress.highestWatched = highestWatched;
            }
            if (isCompleted) {
                progress.isCompleted = true;
            }
        }
        
        await progress.save();
        res.json(progress);
    } catch (err) {
        console.error('Error updating progress:', err);
        res.status(500).json({ error: 'Server error updating progress' });
    }
});

module.exports = router;
