const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { adminAuth } = require('./middleware/auth-middleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks

// Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs for auth routes
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // Limit each IP to 200 requests for general API
    message: 'Too many API requests, please try again later'
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nihongo')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
    res.send('Nihongo Learning Platform API is running');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos')); // GET is public; POST/PUT/DELETE protected per-route
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', adminAuth, require('./routes/admin')); // All admin routes protected
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/certificates', require('./routes/certificates'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
