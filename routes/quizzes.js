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

// --- Inline quiz generation helpers ---
const kanjiDict = {
    N5: [
        { k: '一', r: 'いち', e: 'One' }, { k: '二', r: 'に', e: 'Two' }, { k: '三', r: 'さん', e: 'Three' },
        { k: '四', r: 'よん', e: 'Four' }, { k: '五', r: 'ご', e: 'Five' }, { k: '六', r: 'ろく', e: 'Six' },
        { k: '日', r: 'にち', e: 'Sun/Day' }, { k: '月', r: 'げつ', e: 'Moon/Month' }, { k: '火', r: 'か', e: 'Fire' },
        { k: '水', r: 'みず', e: 'Water' }, { k: '木', r: 'き', e: 'Tree' }, { k: '金', r: 'きん', e: 'Gold' },
        { k: '土', r: 'つち', e: 'Earth' }, { k: '人', r: 'ひと', e: 'Person' }, { k: '本', r: 'ほん', e: 'Book' },
        { k: '男', r: 'おとこ', e: 'Man' }, { k: '女', r: 'おんな', e: 'Woman' }, { k: '子', r: 'こ', e: 'Child' },
        { k: '車', r: 'くるま', e: 'Car' }, { k: '学', r: 'がく', e: 'Study' }
    ],
    N4: [
        { k: '悪', r: 'わるい', e: 'Bad' }, { k: '安', r: 'やすい', e: 'Cheap' }, { k: '暗', r: 'くらい', e: 'Dark' },
        { k: '医', r: 'い', e: 'Doctor' }, { k: '意', r: 'い', e: 'Mind' }, { k: '育', r: 'いく', e: 'Nurture' },
        { k: '員', r: 'いん', e: 'Member' }, { k: '院', r: 'いん', e: 'Institution' }, { k: '飲', r: 'のむ', e: 'Drink' },
        { k: '運', r: 'うん', e: 'Carry' }, { k: '泳', r: 'およぐ', e: 'Swim' }, { k: '駅', r: 'えき', e: 'Station' },
        { k: '央', r: 'おう', e: 'Center' }, { k: '横', r: 'よこ', e: 'Side' }, { k: '屋', r: 'や', e: 'Shop' },
        { k: '温', r: 'あたたかい', e: 'Warm' }, { k: '化', r: 'か', e: 'Change' }, { k: '荷', r: 'に', e: 'Luggage' },
        { k: '界', r: 'かい', e: 'World' }, { k: '開', r: 'あける', e: 'Open' }
    ],
    N3: [
        { k: '愛', r: 'あい', e: 'Love' }, { k: '案', r: 'あん', e: 'Plan' }, { k: '以', r: 'い', e: 'By means of' },
        { k: '衣', r: 'ころも', e: 'Garment' }, { k: '位', r: 'くらい', e: 'Rank' }, { k: '囲', r: 'かこむ', e: 'Surround' },
        { k: '胃', r: 'い', e: 'Stomach' }, { k: '印', r: 'しるし', e: 'Mark' }, { k: '英', r: 'えい', e: 'England/Excellent' },
        { k: '栄', r: 'さかえる', e: 'Flourish' }, { k: '塩', r: 'しお', e: 'Salt' }, { k: '億', r: 'おく', e: 'Hundred Million' },
        { k: '加', r: 'くわえる', e: 'Add' }, { k: '果', r: 'はたす', e: 'Fruit/Result' }, { k: '貨', r: 'か', e: 'Freight' },
        { k: '課', r: 'か', e: 'Chapter' }, { k: '芽', r: 'め', e: 'Sprout' }, { k: '改', r: 'あらためる', e: 'Reform' },
        { k: '械', r: 'かい', e: 'Machine' }, { k: '害', r: 'がい', e: 'Harm' }
    ],
    N2: [
        { k: '圧', r: 'あつ', e: 'Pressure' }, { k: '移', r: 'うつる', e: 'Shift' }, { k: '因', r: 'よる', e: 'Cause' },
        { k: '永', r: 'ながい', e: 'Eternity' }, { k: '営', r: 'いとなむ', e: 'Manage' }, { k: '衛', r: 'えい', e: 'Defense' },
        { k: '易', r: 'やさしい', e: 'Easy' }, { k: '益', r: 'えき', e: 'Benefit' }, { k: '液', r: 'えき', e: 'Fluid' },
        { k: '演', r: 'えん', e: 'Perform' }, { k: '応', r: 'こたえる', e: 'Respond' }, { k: '往', r: 'おう', e: 'Journey' },
        { k: '桜', r: 'さくら', e: 'Cherry Blossom' }, { k: '恩', r: 'おん', e: 'Grace' }, { k: '可', r: 'か', e: 'Possible' },
        { k: '仮', r: 'かり', e: 'Temporary' }, { k: '価', r: 'あたい', e: 'Value' }, { k: '河', r: 'かわ', e: 'River' },
        { k: '過', r: 'すぎる', e: 'Exceed' }, { k: '賀', r: 'が', e: 'Congratulations' }
    ],
    N1: [
        { k: '亜', r: 'あ', e: 'Sub-' }, { k: '哀', r: 'あわれ', e: 'Pathetic' }, { k: '挨', r: 'あい', e: 'Approach' },
        { k: '曖', r: 'あい', e: 'Obscure' }, { k: '握', r: 'にぎる', e: 'Grip' }, { k: '扱', r: 'あつかう', e: 'Handle' },
        { k: '宛', r: 'あてる', e: 'Address' }, { k: '嵐', r: 'あらし', e: 'Storm' }, { k: '依', r: 'よる', e: 'Reliant' },
        { k: '威', r: 'い', e: 'Intimidate' }, { k: '為', r: 'ため', e: 'Do' }, { k: '畏', r: 'おそれる', e: 'Fear' },
        { k: '異', r: 'ことなる', e: 'Uncommon' }, { k: '維', r: 'い', e: 'Fiber' }, { k: '慰', r: 'なぐさめる', e: 'Console' },
        { k: '遺', r: 'のこす', e: 'Bequeath' }, { k: '緯', r: 'い', e: 'Horizontal' }, { k: '犠', r: 'ぎ', e: 'Sacrifice' },
        { k: '茂', r: 'しげる', e: 'Overgrown' }, { k: '繁', r: 'しげる', e: 'Luxuriant' }
    ]
};

const grammarDict = {
    N5: ['〜は〜です', '〜ます/〜ません', '〜に/〜へ', '〜を', '〜が', '〜て/〜で', '〜も', '〜から/〜まで', '〜と', '〜や'],
    N4: ['〜てみる', '〜やすい/にくい', '〜かもしれない', '〜ば/なら/たら', '〜ように', '〜ために', '〜つもり', '〜たがる', '〜はず', '〜らしい'],
    N3: ['〜について', '〜にとって', '〜として', '〜ばかり', '〜くらい', '〜代わりに', '〜うえに', '〜ために', '〜おかげで', '〜せいで'],
    N2: ['〜において', '〜に際して', '〜を問わず', '〜にかかわらず', '〜もかまわず', '〜はともかく', '〜はさておき', '〜わけがない', '〜どころではない', '〜ものか'],
    N1: ['〜あっての', '〜いかん', '〜かたがた', '〜かたわら', '〜がてら', '〜ずくめ', '〜すら', '〜そばから', '〜ただならぬ', '〜たりとも']
};

function shuffleArr(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function autoGenerateQuiz(level, section) {
    const kanjis = kanjiDict[level];
    if (!kanjis) return null;
    const questions = [];
    for (let i = 0; i < 20; i++) {
        const k = kanjis[i % kanjis.length];
        if (section === 'Kanji') {
            const correct = k.r;
            let opts = [correct];
            while (opts.length < 4) {
                const rnd = kanjis[Math.floor(Math.random() * kanjis.length)].r;
                if (!opts.includes(rnd)) opts.push(rnd);
            }
            opts = shuffleArr(opts);
            questions.push({ question: `What is the correct reading for the kanji 「${k.k}」?`, options: opts, correctAnswerIndex: opts.indexOf(correct), explanation: `「${k.k}」 is read as ${k.r} and means "${k.e}".` });
        } else if (section === 'Vocabulary') {
            const correct = k.k;
            let opts = [correct];
            while (opts.length < 4) {
                const rnd = kanjis[Math.floor(Math.random() * kanjis.length)].k;
                if (!opts.includes(rnd)) opts.push(rnd);
            }
            opts = shuffleArr(opts);
            questions.push({ question: `Which word translates to "${k.e}" in English?`, options: opts, correctAnswerIndex: opts.indexOf(correct), explanation: `"${k.e}" translates to 「${k.k}」 (${k.r}).` });
        } else if (section === 'Grammar') {
            const gList = grammarDict[level] || grammarDict['N5'];
            const pattern = gList[i % gList.length];
            let opts = [pattern];
            while (opts.length < 4) {
                const rnd = gList[Math.floor(Math.random() * gList.length)];
                if (!opts.includes(rnd)) opts.push(rnd);
            }
            opts = shuffleArr(opts);
            questions.push({ question: `Choose the correct grammar pattern: ${pattern}`, options: opts, correctAnswerIndex: opts.indexOf(pattern), explanation: `This pattern (${pattern}) is standard JLPT ${level} grammar.` });
        }
    }
    return questions;
}

// @route   GET /api/quizzes/:level/:section
// @desc    Get the 20-question bank for a specific level and section (auto-seeds if empty)
router.get('/:level/:section', async (req, res) => {
    try {
        const { level, section } = req.params;
        let quizBank = await Quiz.findOne({ jlptLevel: level, section: section });
        
        // Auto-generate quiz data if not found in database
        if (!quizBank) {
            console.log(`Auto-generating quiz for ${level}/${section}...`);
            const questions = autoGenerateQuiz(level, section);
            if (!questions || questions.length === 0) {
                return res.status(404).json({ msg: 'Quiz bank not found for this level/section' });
            }
            quizBank = new Quiz({ jlptLevel: level, section, questions });
            await quizBank.save();
            console.log(`Quiz auto-generated and saved for ${level}/${section}`);
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
