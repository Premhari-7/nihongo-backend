const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// Helper to generate codes
const generateCodes = () => {
    const certId = 'CERT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const verCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    return { certId, verCode };
};

// @route   GET /api/quizzes/certificates/:userId
// @desc    Get total number of passed quizzes (certificates) for a user
router.get('/certificates/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Safely convert to ObjectId — return 0 if userId is invalid
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.json({ count: 0 });
        }
        const passedCount = await QuizResult.countDocuments({ userId, passed: true });
        res.json({ count: passedCount });
    } catch (err) {
        console.error('Error fetching certificates count:', err);
        res.json({ count: 0 });
    }
});

// @route   GET /api/quizzes/:level/:section
// @desc    Get the 20-question bank for a specific level and section
router.get('/:level/:section', async (req, res) => {
    try {
        const { level, section } = req.params;
        const quizBank = await Quiz.findOne({ jlptLevel: level, section: section });
        
        if (!quizBank) {
            return res.status(404).json({ msg: 'Quiz bank not found for this level/section' });
        }
        
        res.json(quizBank);
    } catch (err) {
        console.error('Error fetching quiz bank:', err);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/quizzes/result/:userId/:level/:section
// @desc    Get user's previous quiz result
router.get('/result/:userId/:level/:section', async (req, res) => {
    try {
        const { userId, level, section } = req.params;
        const result = await QuizResult.findOne({ userId, jlptLevel: level, section });
        
        res.json(result || { passed: false, score: 0 });
    } catch (err) {
        console.error('Error fetching quiz result:', err);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/quizzes/submit
// @desc    Submit quiz answers, calculate score securely
router.post('/submit', async (req, res) => {
    try {
        const { userId, level, section, answers } = req.body;
        
        const quizBank = await Quiz.findOne({ jlptLevel: level, section: section });
        if (!quizBank) {
            return res.status(404).json({ msg: 'Quiz bank not found' });
        }

        let correctCount = 0;
        const totalQuestions = quizBank.questions.length;

        // Securely calculate score on the backend so user can't cheat
        quizBank.questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswerIndex) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / totalQuestions) * 100);
        const passed = score >= 80;

        let result = await QuizResult.findOne({ userId, jlptLevel: level, section });

        if (result) {
            result.attempts += 1;
            // Only update score if it's higher than previous
            if (score > result.score) {
                result.score = score;
                result.passed = passed;
            }
            await result.save();
        } else {
            result = new QuizResult({
                userId,
                jlptLevel: level,
                section,
                score,
                passed,
                attempts: 1
            });
            await result.save();
        }

        let certificateId = null;
        // --- AUTOMATIC CERTIFICATE GENERATION ---
        if (passed) {
            try {
                // Check if certificate already exists for this level/section
                let existingCert = await Certificate.findOne({ userId, jlptLevel: level, section });
                
                if (!existingCert) {
                    const student = await User.findById(userId);
                    if (student) {
                        const { certId, verCode } = generateCodes();
                        const newCert = new Certificate({
                            certificateId: certId,
                            userId: student._id,
                            userName: student.name,
                            userEmail: student.email,
                            courseName: `JLPT ${level} ${section}`,
                            jlptLevel: level,
                            section,
                            score,
                            verificationCode: verCode
                        });
                        await newCert.save();
                        certificateId = certId;

                        // Notify admins
                        const adminNotification = new Notification({
                            message: `Student ${student.name} earned a ${level} ${section} certificate! (ID: ${certId})`,
                            type: 'certificate_claim',
                            recipientRole: 'admin',
                            userId: student._id
                        });
                        await adminNotification.save();
                    }
                } else {
                    certificateId = existingCert.certificateId;
                    if (score > existingCert.score) {
                        // Update score on existing cert if higher
                        existingCert.score = score;
                        existingCert.issuedDate = Date.now();
                        await existingCert.save();
                    }
                }
            } catch (certErr) {
                console.error('Certificate generation failed:', certErr);
                // We don't fail the quiz submission if cert fails
            }
        }

        res.json({
            score,
            passed,
            correctCount,
            totalQuestions,
            certificateId,
            msg: passed ? 'Congratulations! You passed the quiz.' : 'Keep trying! You need 80% to pass.'
        });
        
    } catch (err) {
        console.error('Error submitting quiz:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
