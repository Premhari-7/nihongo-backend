const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('pass123', salt);
        
        const testUser = {
            name: 'Test Student',
            email: 'teststudent@gmail.com',
            password: hashedPassword,
            role: 'user'
        };

        const adminUser = {
            name: 'Test Admin',
            email: 'testadmin@gmail.com',
            password: hashedPassword,
            role: 'admin'
        };

        await User.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });
        await User.insertMany([testUser, adminUser]);
        
        console.log('Test users created successfully!');
        console.log('Student: teststudent@gmail.com / pass123');
        console.log('Admin: testadmin@gmail.com / pass123');
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createTestUser();
