const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ msg: 'Message is required and must be text' });
        }

        // Basic Prompt Injection Protection
        const blockedKeywords = ['ignore previous', 'forget previous', 'system prompt', 'you are not', 'disregard', 'bypass'];
        const isInjectionAttempt = blockedKeywords.some(kw => message.toLowerCase().includes(kw));

        if (isInjectionAttempt || message.length > 500) {
            return res.status(400).json({ reply: "A true samurai does not fall for trickery. Please ask a proper question about Japanese." });
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
