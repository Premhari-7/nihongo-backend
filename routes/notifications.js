const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// @route   GET /api/notifications
// @desc    Get all active notifications for a user (not hidden by them and matching their role)
router.get('/', async (req, res) => {
    try {
        const { userId, role } = req.query;
        if (!userId) {
            return res.status(400).json({ msg: 'User ID is required' });
        }

        // Find notifications where:
        // 1. User ID is NOT in the hiddenBy array
        // 2. recipientRole is 'all' OR matches the user's role
        const query = {
            hiddenBy: { $ne: userId }
        };

        if (role) {
            query.recipientRole = { $in: ['all', role] };
        }

        const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(20);

        res.json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/notifications/:id/hide
// @desc    Hide a notification for a specific user (simulate deletion for them)
router.post('/:id/hide', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ msg: 'User ID is required' });
        }

        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        // Add user to hiddenBy array if not already there
        if (!notification.hiddenBy.includes(userId)) {
            notification.hiddenBy.push(userId);
            await notification.save();
        }

        res.json({ msg: 'Notification hidden' });
    } catch (err) {
        console.error('Error hiding notification:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
