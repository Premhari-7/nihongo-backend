const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Progress = require('../models/Progress');
const QuizResult = require('../models/QuizResult');

// Get basic admin stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsersCount = await User.countDocuments({ role: 'user' });
        const activeStudentsCount = totalUsersCount; 
        
        // Count actual certificates issued
        const certificatesCount = await Certificate.countDocuments();

        res.json({
            totalUsers: totalUsersCount,
            activeStudents: activeStudentsCount,
            certificates: certificatesCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get real chart data: count students enrolled per JLPT level
router.get('/chart-data', async (req, res) => {
    try {
        const levels = ['N5', 'N4'];
        const data = await Promise.all(levels.map(async (level) => {
            // courseId format is 'N5-Kanji' or 'N5-Vocabulary'
            const userIds = await Progress.distinct('userId', { courseId: new RegExp(`^${level}-`, 'i') });
            return { level, count: userIds.length };
        }));
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get all students
router.get('/students', async (req, res) => {
    try {
        const students = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a student and all associated data
router.delete('/student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // 1. Check if user exists and is a student
        const student = await User.findById(studentId);
        if (!student || student.role !== 'user') {
            return res.status(404).json({ msg: 'Student not found' });
        }

        // 2. Delete all cascading data
        await Progress.deleteMany({ userId: studentId });
        await QuizResult.deleteMany({ userId: studentId });
        await Certificate.deleteMany({ userId: studentId });
        
        // 3. Delete the user
        await User.findByIdAndDelete(studentId);

        res.json({ msg: 'Student and all associated data deleted successfully' });
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
