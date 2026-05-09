const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ msg: 'Message is required' });
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a fierce but wise Japanese Samurai AI named Jin Sakai. You assist users in learning the Japanese language (Nihongo). Keep your answers concise, engaging, and always infuse a bit of samurai spirit and Japanese words (with Romaji) in your responses.'
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            model: 'llama-3.1-8b-instant', // Active model
            temperature: 0.7,
            max_tokens: 150,
        });

        const reply = completion.choices[0]?.message?.content || 'Silence is a warrior\'s best answer.';

        res.json({ reply });
    } catch (err) {
        console.error('Groq API Error:', err);
        res.status(500).json({ error: 'Failed to connect to Samurai brain.' });
    }
});

module.exports = router;
