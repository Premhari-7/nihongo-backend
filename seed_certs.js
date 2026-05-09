const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Find the test student we just created
        const user = await User.findOne({ email: 'teststudent@gmail.com' });
        if (!user) {
            console.log('Test student not found. Run create_test_users.js first.');
            process.exit(0);
        }

        const sampleCerts = [
            {
                userId: user._id,
                userName: user.name || 'Jin Sakai',
                userEmail: user.email,
                courseName: 'JLPT N5 - Masterclass',
                jlptLevel: 'N5',
                section: 'Kanji',
                score: 95,
                certificateId: 'CERT-A1B2C3D4',
                verificationCode: 'SAMURAI-777',
                issuedDate: new Date(),
                revoked: false
            },
            {
                userId: user._id,
                userName: 'Arataki Itto',
                userEmail: 'itto@oni.com',
                courseName: 'JLPT N4 - Intermediate Kanji',
                jlptLevel: 'N4',
                section: 'Grammar',
                score: 88,
                certificateId: 'CERT-X9Y8Z7W6',
                verificationCode: 'ONI-888',
                issuedDate: new Date(Date.now() - 86400000 * 2),
                revoked: false
            }
        ];

        await Certificate.deleteMany({});
        await Certificate.insertMany(sampleCerts);
        console.log('Sample certificates seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
